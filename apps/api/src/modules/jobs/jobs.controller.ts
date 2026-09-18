import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { buildAuditContext } from '@/modules/audit/audit-context.util';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import {
  RejectJobInput,
  rejectJobSchema,
  UpdateJobInput,
  updateJobSchema,
} from '@careerslk/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { FilterJobsDto } from './dto/filters.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(PermissionsGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.JOBS_READ)
  findAll(@Query() filters: FilterJobsDto) {
    return this.jobsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.JOBS_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.JOBS_UPDATE)
  update(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateJobSchema)) dto: UpdateJobInput,
    @Req() req: Request,
  ) {
    return this.jobsService.update(id, dto, buildAuditContext(actor, req));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.JOBS_DELETE)
  remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.jobsService.softDelete(id, buildAuditContext(actor, req));
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.JOBS_APPROVE)
  approve(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.jobsService.approve(
      id,
      actor.userId,
      buildAuditContext(actor, req),
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.JOBS_APPROVE)
  reject(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(rejectJobSchema)) dto: RejectJobInput,
    @Req() req: Request,
  ) {
    return this.jobsService.reject(id, dto, buildAuditContext(actor, req));
  }
}
