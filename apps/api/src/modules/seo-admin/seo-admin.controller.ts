import {
  CurrentPrincipal,
  RequirePermissions,
} from '@/common/decorators/rbac.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { SeoGenerationService } from '@/modules/seo/seo-generation.service';
import type { AuthenticatedPrincipal } from '@/modules/auth/interfaces/jwt-payload.interface';
import { PERMISSIONS } from '@careerslk/lib';
import {
  SeoPageType,
  UpdateSeoPageInput,
  updateSeoPageSchema,
} from '@careerslk/types';
import {
  Body,
  Controller,
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
import { FilterSeoPagesDto } from './dto/filter-seo-pages.dto';

@Controller('seo/pages')
@UseGuards(PermissionsGuard)
export class SeoAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seoGenerationService: SeoGenerationService,
    private readonly audit: AuditService,
  ) {}

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
  @RequirePermissions(PERMISSIONS.SEO_READ)
  findAll(@Query() filters: FilterSeoPagesDto) {
    const pageTypeIn = filters.pageTypes
      ?.split(',')
      .filter((value): value is SeoPageType =>
        Object.values(SeoPageType).includes(value as SeoPageType),
      );

    return this.prisma.seoPage.findMany({
      where: {
        pageType: pageTypeIn ? { in: pageTypeIn } : filters.pageType,
        needsReview: filters.needsReview,
        manualOverride: filters.manualOverride,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SEO_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.seoPage.findUniqueOrThrow({ where: { id } });
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SEO_UPDATE)
  async update(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateSeoPageSchema)) dto: UpdateSeoPageInput,
    @Req() req: Request,
  ) {
    const page = await this.prisma.seoPage.update({
      where: { id },
      data: { ...dto, manualOverride: true, lastReviewedAt: new Date() },
    });

    await this.audit.record(this.auditContext(actor, req), {
      action: AUDIT_ACTIONS.SEO_PAGE_UPDATED,
      entityType: 'seo_page',
      entityId: page.id,
      newValue: { slug: page.slug },
    });

    return page;
  }

  @Post('generate')
  @RequirePermissions(PERMISSIONS.SEO_UPDATE)
  generate() {
    return this.seoGenerationService.regenerateAll();
  }

  @Post(':id/regenerate')
  @RequirePermissions(PERMISSIONS.SEO_UPDATE)
  async regenerate(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Query('force') force: string | undefined,
    @Req() req: Request,
  ) {
    await this.seoGenerationService.regenerateOne(id, force === 'true');

    await this.audit.record(this.auditContext(actor, req), {
      action: AUDIT_ACTIONS.SEO_PAGE_REGENERATED,
      entityType: 'seo_page',
      entityId: id,
    });

    return this.prisma.seoPage.findUniqueOrThrow({ where: { id } });
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PERMISSIONS.SEO_UPDATE)
  async deactivate(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const page = await this.prisma.seoPage.update({
      where: { id },
      data: { isIndexable: false, deactivatedAt: new Date() },
    });

    await this.audit.record(this.auditContext(actor, req), {
      action: AUDIT_ACTIONS.SEO_PAGE_DEACTIVATED,
      entityType: 'seo_page',
      entityId: page.id,
    });

    return page;
  }

  @Patch(':id/reactivate')
  @RequirePermissions(PERMISSIONS.SEO_UPDATE)
  async reactivate(
    @CurrentPrincipal() actor: AuthenticatedPrincipal,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const page = await this.prisma.seoPage.update({
      where: { id },
      data: {
        isIndexable: true,
        deactivatedAt: null,
        retiredAt: null,
        firstBelowThresholdAt: null,
      },
    });

    await this.audit.record(this.auditContext(actor, req), {
      action: AUDIT_ACTIONS.SEO_PAGE_REACTIVATED,
      entityType: 'seo_page',
      entityId: page.id,
    });

    return page;
  }
}
