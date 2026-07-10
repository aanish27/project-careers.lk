import { SCRAPER_COMPANY_QUEUE, SCRAPER_JOB_QUEUE } from '@careerslk/types';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  imports: [
    BullModule.registerQueue(
      { name: SCRAPER_COMPANY_QUEUE },
      { name: SCRAPER_JOB_QUEUE },
    ),
  ],
})
export class DashboardModule {}
