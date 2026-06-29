import { SCRAPER_COMPANY_QUEUE, SCRAPER_JOB_QUEUE } from '@careerslk/types';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperScheduler } from './scraper.scheduler';
import { ScraperService } from './scraper.service';

@Module({
  controllers: [ScraperController],
  providers: [ScraperService, ScraperScheduler],
  imports: [
    BullModule.registerQueue(
      {
        name: SCRAPER_COMPANY_QUEUE,
      },
      {
        name: SCRAPER_JOB_QUEUE,
      },
    ),
  ],
})
export class ScraperModule {}
