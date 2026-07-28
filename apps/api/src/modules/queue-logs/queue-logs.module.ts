import {
  SCRAPER_BATCH_POLL_QUEUE,
  SCRAPER_COMPANY_QUEUE,
  SCRAPER_JOB_QUEUE,
} from '@careerslk/types';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueLogsController } from './queue-logs.controller';
import { QueueLogsService } from './queue-logs.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SCRAPER_COMPANY_QUEUE },
      { name: SCRAPER_JOB_QUEUE },
      { name: SCRAPER_BATCH_POLL_QUEUE },
    ),
  ],
  controllers: [QueueLogsController],
  providers: [QueueLogsService],
})
export class QueueLogsModule {}
