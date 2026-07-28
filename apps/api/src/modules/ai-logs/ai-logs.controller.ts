import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PERMISSIONS } from '@careerslk/lib';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AiLogsService } from './ai-logs.service';
import { FilterAiLogsDto } from './dto/filter-ai-logs.dto';

@Controller('ai-logs')
@UseGuards(PermissionsGuard)
export class AiLogsController {
  constructor(private readonly aiLogsService: AiLogsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AI_LOGS_READ)
  findAll(@Query() filters: FilterAiLogsDto) {
    return this.aiLogsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.AI_LOGS_READ)
  findOne(@Param('id') id: string) {
    return this.aiLogsService.findOne(id);
  }
}
