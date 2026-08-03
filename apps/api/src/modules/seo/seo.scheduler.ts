import {
  SEO_EXPIRY_QUEUE,
  SEO_GENERATION_QUEUE,
  SEO_LIFECYCLE_QUEUE,
} from '@careerslk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

const EXPIRY_SCHEDULER_ID = 'daily-seo-expiry';
const GENERATION_SCHEDULER_ID = 'daily-seo-generation';
const LIFECYCLE_SCHEDULER_ID = 'weekly-seo-lifecycle';

/**
 * Three independent schedules (decision #7), not one blind cron:
 *  - expiry flip: daily, calendar-based — nothing else can trigger it.
 *  - generation: daily, offset shortly after the scraper's own daily cron.
 *    (A true event-driven "on scrape completion" trigger was considered,
 *    but the scraper itself only runs once a day via ScraperScheduler, so a
 *    same-morning offset cron achieves the same practical freshness without
 *    taking on BullMQ QueueEvents wiring. Admin-triggered manual scrapes can
 *    also be followed by the always-available on-demand /admin/seo/generate
 *    endpoint.)
 *  - lifecycle evaluation: weekly — deliberately decoupled from generation
 *    frequency, using a real elapsed-time threshold rather than a run count
 *    (see SeoLifecycleService).
 */
@Injectable()
export class SeoScheduler implements OnModuleInit {
  private readonly logger = new Logger(SeoScheduler.name);

  constructor(
    @InjectQueue(SEO_EXPIRY_QUEUE) private readonly expiryQueue: Queue,
    @InjectQueue(SEO_GENERATION_QUEUE) private readonly generationQueue: Queue,
    @InjectQueue(SEO_LIFECYCLE_QUEUE) private readonly lifecycleQueue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const tz = this.config.get<string>('SEO_TZ') ?? 'Asia/Colombo';

    const expiryCron =
      this.config.get<string>('SEO_EXPIRY_CRON') ?? '0 2 * * *';
    await this.expiryQueue.upsertJobScheduler(
      EXPIRY_SCHEDULER_ID,
      { pattern: expiryCron, tz },
      { name: 'seo-expiry-flip', data: {} },
    );

    const generationCron =
      this.config.get<string>('SEO_GENERATION_CRON') ?? '0 3 * * *';
    await this.generationQueue.upsertJobScheduler(
      GENERATION_SCHEDULER_ID,
      { pattern: generationCron, tz },
      { name: 'seo-generation-run', data: {} },
    );

    const lifecycleCron =
      this.config.get<string>('SEO_LIFECYCLE_CRON') ?? '0 4 * * 0';
    await this.lifecycleQueue.upsertJobScheduler(
      LIFECYCLE_SCHEDULER_ID,
      { pattern: lifecycleCron, tz },
      { name: 'seo-lifecycle-evaluation', data: {} },
    );

    this.logger.log(
      `Scheduled SEO jobs: expiry='${expiryCron}', generation='${generationCron}', lifecycle='${lifecycleCron}' (tz=${tz})`,
    );
  }
}
