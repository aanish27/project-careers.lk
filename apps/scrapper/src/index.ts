import {
  CompanyStatus,
  JobStatus,
  Prisma,
  ScrapeLogTrigger,
  ScrapeStatus,
} from '@careerslk/database';
import {
  BATCH_POLL_DELAY_MS,
  BatchPollJobData,
  SCRAPER_BATCH_POLL_QUEUE,
  SCRAPER_COMPANY_QUEUE,
  SCRAPER_JOB_QUEUE,
  SCRAPE_BACKOFF_MS,
  ScraperJobData,
} from '@careerslk/types';
import { Worker, WorkerOptions } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { ClaudeService } from './services/claude.service';
import { HashService } from './services/hash.service';
import { ScrapeService } from './services/scrape.service';
import { ScrapeType } from './utils/enum';
import { prisma } from './utils/prisma';
import { connection } from './utils/redis';

async function resolveCompanies(data: ScraperJobData) {
  const raw = data.companyId;

  if (raw === undefined) {
    return prisma.company.findMany({
      where: {
        htmlSelector: { not: null },
        scrapeStatus: { in: [ScrapeStatus.ACTIVE, ScrapeStatus.EMPTY] },
        status: CompanyStatus.ACTIVE,
      },
    });
  }
  if (Array.isArray(raw)) {
    return prisma.company.findMany({ where: { id: { in: raw } } });
  }
  return prisma.company.findUniqueOrThrow({ where: { id: raw } });
}

const workerOptions: WorkerOptions = {
  connection,
  concurrency: 1, // scraping launches a browser; keep it serial
  settings: {
    // Resolves backoff: { type: 'custom' } → 30s, 2min, 10min (SRS §8.2).
    // attemptsMade is 1 on the first failure.
    backoffStrategy: (attemptsMade: number) =>
      SCRAPE_BACKOFF_MS[attemptsMade - 1] ?? SCRAPE_BACKOFF_MS.at(-1)!,
  },
};

const companyWorker = new Worker<ScraperJobData>(
  SCRAPER_COMPANY_QUEUE,
  async (job) => {
    const contents = await resolveCompanies(job.data);
    await ScrapeService.scrape(
      contents,
      ScrapeType.COMPANY,
      ScrapeLogTrigger.SCHEDULED,
    );
  },
  workerOptions,
);

const jobsWorker = new Worker<ScraperJobData>(
  SCRAPER_JOB_QUEUE,
  async (job) => {
    const contents = await resolveCompanies(job.data);
    await ScrapeService.scrape(
      contents,
      ScrapeType.JOBS,
      ScrapeLogTrigger.SCHEDULED,
    );

    const companyIds = Array.isArray(contents)
      ? contents.map((c) => c.id)
      : [contents.id];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.job.updateMany({
      where: {
        companyId: { in: companyIds },
        company: {
          status: CompanyStatus.ACTIVE,
          scrapeStatus: ScrapeStatus.EMPTY,
          lastScrapedAt: { gte: today, lt: tomorrow },
        },
        NOT: { lastSeenAt: { gte: today, lt: tomorrow } },
      },
      data: {
        status: JobStatus.EXPIRED,
        fingerprint: HashService.hash(`${today} ${uuidv4()}`),
      },
    });
  },
  workerOptions,
);

const batchPollWorker = new Worker<BatchPollJobData>(
  SCRAPER_BATCH_POLL_QUEUE,
  async (job) => {
    await ClaudeService.processBatch(
      job.data.batchId,
      job.data.type as ScrapeType,
    );
  },
  {
    connection,
    concurrency: 5,
    settings: {
      backoffStrategy: () => BATCH_POLL_DELAY_MS,
    },
  },
);

for (const worker of [companyWorker, jobsWorker, batchPollWorker]) {
  worker.on('completed', (job) => {
    console.log(`✅ [${worker.name}] queue job ${job.id} completed`);

    prisma.notification
      .create({
        data: {
          type: 'SCRAPE_COMPLETED',
          title: 'Scrape completed',
          message: `${job.name} finished successfully`,
          metadata: {
            queue: worker.name,
            jobId: job.id,
            data: job.data,
          } as unknown as Prisma.InputJsonValue,
        },
      })
      .catch((err: unknown) =>
        console.error('Failed to write scrape-completed notification', err),
      );
  });
  worker.on('failed', (job, err) => {
    console.error(
      `❌ [${worker.name}] queue job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );

    // BullMQ fires 'failed' on every attempt, not just the last one — only
    // notify once retries are exhausted, so a single failing job doesn't
    // spam the bell with one notification per retry.
    const maxAttempts = job?.opts.attempts ?? 1;
    if (!job || job.attemptsMade < maxAttempts) return;

    prisma.notification
      .create({
        data: {
          type: 'SCRAPE_FAILED',
          title: 'Scrape failed',
          message: `${job.name} failed: ${err.message}`,
          metadata: {
            queue: worker.name,
            jobId: job.id,
            data: job.data,
          } as unknown as Prisma.InputJsonValue,
        },
      })
      .catch((notifyErr: unknown) =>
        console.error('Failed to write scrape-failed notification', notifyErr),
      );
  });
}

console.log(
  '🚀 Scraper workers ready:',
  SCRAPER_COMPANY_QUEUE,
  SCRAPER_JOB_QUEUE,
  SCRAPER_BATCH_POLL_QUEUE,
);

// Graceful shutdown so in-flight jobs aren't dropped mid-scrape.
async function shutdown() {
  await Promise.all([
    companyWorker.close(),
    jobsWorker.close(),
    batchPollWorker.close(),
  ]);
  await prisma.$disconnect();
  await connection.quit();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
