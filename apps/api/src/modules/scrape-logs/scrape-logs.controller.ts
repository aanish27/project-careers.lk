import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PERMISSIONS } from '@careerslk/lib';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FilterScrapeLogsDto } from './dto/filter-scrape-logs.dto';
import { ScrapeLogsService } from './scrape-logs.service';

@Controller('scrape-logs')
@UseGuards(PermissionsGuard)
export class ScrapeLogsController {
  constructor(private readonly scrapeLogsService: ScrapeLogsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SCRAPE_LOGS_READ)
  findAll(@Query() filters: FilterScrapeLogsDto) {
    return this.scrapeLogsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SCRAPE_LOGS_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.scrapeLogsService.findOne(id);
  }
}
