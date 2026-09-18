import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { buildAuditContext } from '@/modules/audit/audit-context.util';
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
    return this.gigsService.softDelete(id, buildAuditContext(actor, req));
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
      buildAuditContext(actor, req),
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
    return this.gigsService.reject(id, dto, buildAuditContext(actor, req));
  }
}
