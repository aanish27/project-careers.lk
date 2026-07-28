import {
  SCRAPER_BATCH_POLL_QUEUE,
  SCRAPER_COMPANY_QUEUE,
  SCRAPER_JOB_QUEUE,
  QueueLogSnapshot,
} from '@careerslk/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

const JOB_STATES = [
  'waiting',
  'active',
  'completed',
  'failed',
  'delayed',
] as const;

/** Sample size per state, per queue — enough for a live-view without unbounded payloads. */
const JOBS_PER_STATE = 20;

@Injectable()
export class QueueLogsService {
  constructor(
    @InjectQueue(SCRAPER_COMPANY_QUEUE) private readonly companyQueue: Queue,
    @InjectQueue(SCRAPER_JOB_QUEUE) private readonly jobQueue: Queue,
    @InjectQueue(SCRAPER_BATCH_POLL_QUEUE)
    private readonly batchPollQueue: Queue,
  ) {}

  async findAll(): Promise<QueueLogSnapshot[]> {
    return await Promise.all([
      this.snapshot(SCRAPER_COMPANY_QUEUE, this.companyQueue),
      this.snapshot(SCRAPER_JOB_QUEUE, this.jobQueue),
      this.snapshot(SCRAPER_BATCH_POLL_QUEUE, this.batchPollQueue),
    ]);
  }

  private async snapshot(
    name: string,
    queue: Queue,
  ): Promise<QueueLogSnapshot> {
    const [counts, jobsByState] = await Promise.all([
      queue.getJobCounts(...JOB_STATES),
      Promise.all(
        JOB_STATES.map((state) =>
          queue.getJobs([state], 0, JOBS_PER_STATE - 1),
        ),
      ),
    ]);

    const jobs = JOB_STATES.flatMap((state, index) =>
      jobsByState[index].map((job) => ({
        id: job.id ?? null,
        name: job.name,
        state,
        data: job.data as unknown,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason || null,
        timestamp: job.timestamp,
        processedOn: job.processedOn ?? null,
        finishedOn: job.finishedOn ?? null,
      })),
    );

    return { queue: name, counts, jobs };
  }
}
