import { SCRAPE_BACKOFF_MS, SCRAPER_JOB_QUEUE } from '@careerslk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

/** Stable scheduler id — reusing it makes upserts idempotent across restarts. */
const DAILY_JOBS_SCHEDULER_ID = 'daily-jobs-scrape';

@Injectable()
export class ScraperScheduler implements OnModuleInit {
  private readonly logger = new Logger(ScraperScheduler.name);

  constructor(
    @InjectQueue(SCRAPER_JOB_QUEUE) private readonly jobQueue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const pattern = this.config.get<string>('SCRAPE_CRON') ?? '0 2 * * *';
    const tz = this.config.get<string>('SCRAPE_TZ') ?? 'Asia/Colombo';

    // upsert (not add) → re-running on every boot updates the single schedule
    // in place instead of creating duplicates.
    await this.jobQueue.upsertJobScheduler(
      DAILY_JOBS_SCHEDULER_ID,
      { pattern, tz },
      {
        name: 'scheduled-jobs-scrape',
        // No companyId on purpose: the worker resolves "all companies with an
        // htmlSelector" at run time, so companies added after boot are included
        // automatically and the whole set goes out as one Claude batch.
        data: {},
        opts: {
          attempts: SCRAPE_BACKOFF_MS.length, // 3 attempts
          backoff: { type: 'custom' }, // strategy lives on the worker
          removeOnComplete: 100,
          removeOnFail: 1000,
        },
      },
    );

    this.logger.log(
      `Scheduled daily jobs scrape (cron='${pattern}', tz=${tz})`,
    );
  }
}
