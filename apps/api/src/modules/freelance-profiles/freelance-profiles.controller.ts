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
  RejectFreelanceProfileInput,
  rejectFreelanceProfileSchema,
} from '@careerslk/types';
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
import { FilterFreelanceProfilesDto } from './dto/filters.dto';
import { FreelanceProfilesService } from './freelance-profiles.service';

@Controller('freelance-profiles')
@UseGuards(PermissionsGuard)
export class FreelanceProfilesController {
  constructor(
    private readonly freelanceProfilesService: FreelanceProfilesService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.FREELANCE_PROFILES_READ)
  findAll(@Query() filters: FilterFreelanceProfilesDto) {
    return this.freelanceProfilesService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.FREELANCE_PROFILES_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.freelanceProfilesService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.FREELANCE_PROFILES_DELETE)
  remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.freelanceProfilesService.softDelete(
      id,
      buildAuditContext(actor, req),
    );
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.FREELANCE_PROFILES_APPROVE)
  approve(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.freelanceProfilesService.approve(
      id,
      actor.userId,
      buildAuditContext(actor, req),
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.FREELANCE_PROFILES_APPROVE)
  reject(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(rejectFreelanceProfileSchema))
    dto: RejectFreelanceProfileInput,
    @Req() req: Request,
  ) {
    return this.freelanceProfilesService.reject(
      id,
      dto,
      buildAuditContext(actor, req),
    );
  }
}
