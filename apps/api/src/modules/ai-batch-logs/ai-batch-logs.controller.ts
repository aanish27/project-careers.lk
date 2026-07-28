import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PERMISSIONS } from '@careerslk/lib';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AiBatchLogsService } from './ai-batch-logs.service';
import { FilterAiBatchLogsDto } from './dto/filter-ai-batch-logs.dto';

@Controller('ai-batch-logs')
@UseGuards(PermissionsGuard)
export class AiBatchLogsController {
  constructor(private readonly aiBatchLogsService: AiBatchLogsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AI_BATCH_LOGS_READ)
  findAll(@Query() filters: FilterAiBatchLogsDto) {
    return this.aiBatchLogsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.AI_BATCH_LOGS_READ)
  findOne(@Param('id') id: string) {
    return this.aiBatchLogsService.findOne(id);
  }
}
