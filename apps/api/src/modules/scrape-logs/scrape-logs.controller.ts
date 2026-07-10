import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FilterScrapeLogsDto } from './dto/filter-scrape-logs.dto';
import { ScrapeLogsService } from './scrape-logs.service';

@Controller('admin/scrape-logs')
export class ScrapeLogsController {
  constructor(private readonly scrapeLogsService: ScrapeLogsService) {}

  @Get()
  findAll(@Query() filters: FilterScrapeLogsDto) {
    const { page, limit, ...rest } = filters;
    return this.scrapeLogsService.findAll(rest, page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scrapeLogsService.findOne(id);
  }
}
