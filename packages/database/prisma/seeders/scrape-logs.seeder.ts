import {
  PrismaClient,
  ScrapeLogStatus,
  ScrapeLogTrigger,
} from '@careerslk/database';
import type { Company } from '@careerslk/database';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

export async function seedScrapeLogs(
  prisma: PrismaClient,
  companies: Company[],
) {
  const existing = await prisma.scrapeLog.count();
  if (existing > 0) {
    console.log('Scrape logs already seeded, skipping');
    return;
  }

  console.log(`Seeding scrape logs for ${companies.length} companies...`);

  let scrapeLogCount = 0;
  let aiLogCount = 0;

  for (const company of companies) {
    const runs = faker.number.int({ min: 1, max: 6 });

    for (let i = 0; i < runs; i++) {
      const status = faker.helpers.weightedArrayElement([
        { value: ScrapeLogStatus.SUCCESS, weight: 7 },
        { value: ScrapeLogStatus.EMPTY, weight: 1 },
        { value: ScrapeLogStatus.SUSPECTED_FAILURE, weight: 1 },
        { value: ScrapeLogStatus.ERROR, weight: 1 },
      ]);
      const jobsFound =
        status === ScrapeLogStatus.SUCCESS
          ? faker.number.int({ min: 0, max: 40 })
          : 0;

      const scrapeLog = await prisma.scrapeLog.create({
        data: {
          companyId: company.id,
          triggeredBy: faker.helpers.weightedArrayElement([
            { value: ScrapeLogTrigger.SCHEDULED, weight: 4 },
            { value: ScrapeLogTrigger.MANUAL, weight: 1 },
          ]),
          jobsFound,
          status,
          errorMessage:
            status === ScrapeLogStatus.ERROR
              ? faker.helpers.arrayElement([
                  'Timed out waiting for selector',
                  'HTTP 403 Forbidden',
                  'Failed to parse job container',
                ])
              : null,
          durationMs: faker.number.int({ min: 800, max: 25_000 }),
          htmlLength: faker.number.int({ min: 5_000, max: 250_000 }),
          type: faker.helpers.arrayElement(['jobs', 'company']),
          createdAt: faker.date.recent({ days: 60 }),
        },
      });
      scrapeLogCount++;

      const aiCallCount = faker.number.int({ min: 0, max: 2 });
      for (let j = 0; j < aiCallCount; j++) {
        await prisma.aiLog.create({
          data: {
            id: randomUUID(),
            companyId: company.id,
            scrapeLogId: scrapeLog.id,
            status: faker.helpers.arrayElement(['completed', 'errored']),
            stopReason: faker.helpers.arrayElement([
              'end_turn',
              'max_tokens',
              null,
            ]),
            model: CLAUDE_MODEL,
            inputTokens: faker.number.int({ min: 500, max: 12_000 }),
            outputTokens: faker.number.int({ min: 100, max: 3_000 }),
            createdAt: scrapeLog.createdAt,
          },
        });
        aiLogCount++;
      }
    }
  }

  console.log(
    `  Seeded ${scrapeLogCount} scrape logs and ${aiLogCount} AI logs`,
  );
}
