import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { buildAuditContext } from '@/modules/audit/audit-context.util';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import { ResolveReportInput, resolveReportSchema } from '@careerslk/types';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { FilterReportsDto } from './dto/filters.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.REPORTS_READ)
  findAll(@Query() filters: FilterReportsDto) {
    return this.reportsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.REPORTS_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.findOne(id);
  }

  @Post(':id/review')
  @RequirePermissions(PERMISSIONS.REPORTS_REVIEW)
  review(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(resolveReportSchema)) dto: ResolveReportInput,
    @Req() req: Request,
  ) {
    return this.reportsService.review(id, dto, buildAuditContext(actor, req));
  }

  @Post(':id/dismiss')
  @RequirePermissions(PERMISSIONS.REPORTS_REVIEW)
  dismiss(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(resolveReportSchema)) dto: ResolveReportInput,
    @Req() req: Request,
  ) {
    return this.reportsService.dismiss(id, dto, buildAuditContext(actor, req));
  }
}
