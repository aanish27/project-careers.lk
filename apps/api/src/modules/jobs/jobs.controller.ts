import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditContext } from '@/modules/audit/audit.service';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import { UpdateJobInput, updateJobSchema } from '@careerslk/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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

  private auditContext(
    principal: AuthenticatedPrincipal,
    req: Request,
  ): AuditContext {
    return {
      actorUserId: principal.userId,
      actorEmail: principal.email,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent']?.slice(0, 255) ?? null,
    };
  }

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
    return this.jobsService.update(id, dto, this.auditContext(actor, req));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.JOBS_DELETE)
  remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.jobsService.softDelete(id, this.auditContext(actor, req));
  }
}
