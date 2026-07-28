import { RequirePermissions } from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PERMISSIONS } from '@careerslk/lib';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueueLogsService } from './queue-logs.service';

@Controller('queue-logs')
@UseGuards(PermissionsGuard)
export class QueueLogsController {
  constructor(private readonly queueLogsService: QueueLogsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.QUEUE_LOGS_READ)
  findAll() {
    return this.queueLogsService.findAll();
  }
}
