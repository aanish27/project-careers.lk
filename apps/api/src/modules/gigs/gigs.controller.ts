import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditContext } from '@/modules/audit/audit.service';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import { RejectGigInput, rejectGigSchema } from '@careerslk/types';
import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { FilterGigsDto } from './dto/filters.dto';
import { GigsService } from './gigs.service';

@Controller('gigs')
@UseGuards(PermissionsGuard)
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

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
  @RequirePermissions(PERMISSIONS.GIGS_READ)
  findAll(@Query() filters: FilterGigsDto) {
    return this.gigsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.GIGS_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gigsService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.GIGS_DELETE)
  remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.gigsService.softDelete(id, this.auditContext(actor, req));
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.GIGS_APPROVE)
  approve(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.gigsService.approve(
      id,
      actor.userId,
      this.auditContext(actor, req),
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.GIGS_APPROVE)
  reject(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(rejectGigSchema)) dto: RejectGigInput,
    @Req() req: Request,
  ) {
    return this.gigsService.reject(id, dto, this.auditContext(actor, req));
  }
}
