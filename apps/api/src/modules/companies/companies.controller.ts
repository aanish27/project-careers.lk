import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditContext } from '@/modules/audit/audit.service';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import {
  ClaimStatus,
  CreateCompanyInput,
  createCompanySchema,
  UpdateCompanyInput,
  updateCompanySchema,
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
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(PermissionsGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

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

  @Post()
  @RequirePermissions(PERMISSIONS.COMPANIES_CREATE)
  create(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(createCompanySchema)) dto: CreateCompanyInput,
    @Req() req: Request,
  ) {
    return this.companiesService.create(dto, this.auditContext(actor, req));
  }

  @Get()
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  findAll() {
    return this.companiesService.findAll();
  }

  // Must be registered before ':id' — otherwise ':id' + ParseIntPipe swallows
  // this literal path since Nest/Express match routes in registration order.
  @Get('scrape-summary')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  getScrapeSummaries() {
    return this.companiesService.getScrapeSummaries();
  }

  // Also literal — same route-ordering reasoning as 'scrape-summary' above.
  @Get('claims')
  @RequirePermissions(PERMISSIONS.COMPANIES_CLAIMS_REVIEW)
  listClaims(@Query('status') status?: ClaimStatus) {
    return this.companiesService.listClaims(status);
  }

  @Post('claims/:id/approve')
  @RequirePermissions(PERMISSIONS.COMPANIES_CLAIMS_REVIEW)
  approveClaim(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.companiesService.approveClaim(
      id,
      actor.userId,
      this.auditContext(actor, req),
    );
  }

  @Post('claims/:id/reject')
  @RequirePermissions(PERMISSIONS.COMPANIES_CLAIMS_REVIEW)
  rejectClaim(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.companiesService.rejectClaim(
      id,
      actor.userId,
      this.auditContext(actor, req),
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.COMPANIES_UPDATE)
  update(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateCompanySchema)) dto: UpdateCompanyInput,
    @Req() req: Request,
  ) {
    return this.companiesService.update(id, dto, this.auditContext(actor, req));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.COMPANIES_DELETE)
  remove(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.companiesService.softDelete(id, this.auditContext(actor, req));
  }

  @Post(':id/trust')
  @RequirePermissions(PERMISSIONS.COMPANIES_TRUST)
  trust(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.companiesService.trust(id, this.auditContext(actor, req));
  }

  @Post(':id/untrust')
  @RequirePermissions(PERMISSIONS.COMPANIES_TRUST)
  untrust(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.companiesService.untrust(id, this.auditContext(actor, req));
  }
}
