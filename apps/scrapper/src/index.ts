import { CompanyStatus, JobStatus, ScrapeStatus } from '@careerslk/database';
import {
  SCRAPER_COMPANY_QUEUE,
  SCRAPER_JOB_QUEUE,
  SCRAPE_BACKOFF_MS,
  ScraperJobData,
} from '@careerslk/types';
import { Worker, WorkerOptions } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
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
    await ScrapeService.scrape(contents, ScrapeType.COMPANY);
  },
  workerOptions,
);

const jobsWorker = new Worker<ScraperJobData>(
  SCRAPER_JOB_QUEUE,
  async (job) => {
    const contents = await resolveCompanies(job.data);
    await ScrapeService.scrape(contents, ScrapeType.JOBS);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.job.updateMany({
      where: {
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

for (const worker of [companyWorker, jobsWorker]) {
  worker.on('completed', (job) =>
    console.log(`✅ [${worker.name}] queue job ${job.id} completed`),
  );
  worker.on('failed', (job, err) =>
    console.error(
      `❌ [${worker.name}] queue job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    ),
  );
}

console.log(
  '🚀 Scraper workers ready:',
  SCRAPER_COMPANY_QUEUE,
  SCRAPER_JOB_QUEUE,
);

// Graceful shutdown so in-flight jobs aren't dropped mid-scrape.
async function shutdown() {
  await Promise.all([companyWorker.close(), jobsWorker.close()]);
  await prisma.$disconnect();
  await connection.quit();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
