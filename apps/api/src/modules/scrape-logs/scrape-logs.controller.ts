import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FilterScrapeLogsDto } from './dto/filter-scrape-logs.dto';
import { ScrapeLogsService } from './scrape-logs.service';

@Controller('admin/scrape-logs')
export class ScrapeLogsController {
  constructor(private readonly scrapeLogsService: ScrapeLogsService) {}

  @Get()
  findAll(@Query() filters: FilterScrapeLogsDto) {
    return this.scrapeLogsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scrapeLogsService.findOne(id);
  }
}
