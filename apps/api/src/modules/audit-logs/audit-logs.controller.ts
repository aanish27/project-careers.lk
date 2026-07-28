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
import { AuditLogsService } from './audit-logs.service';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';

@Controller('audit-logs')
@UseGuards(PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_LOGS_READ)
  findAll(@Query() filters: FilterAuditLogsDto) {
    return this.auditLogsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.AUDIT_LOGS_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditLogsService.findOne(id);
  }
}
