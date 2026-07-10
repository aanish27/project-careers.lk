import { Module } from '@nestjs/common';
import { ScrapeLogsController } from './scrape-logs.controller';
import { ScrapeLogsService } from './scrape-logs.service';

@Module({
  controllers: [ScrapeLogsController],
  providers: [ScrapeLogsService],
})
export class ScrapeLogsModule {}
