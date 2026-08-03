import { PrismaService } from '@/database/prisma.service';
import type { SeoPageUncheckedCreateInput } from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import { SECTORS, SEO_PAGE_THRESHOLDS, SeoPageType } from '@careerslk/types';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SeoInputService } from './seo-input.service';
import { SeoLinksService } from './seo-links.service';
import { generateSeoTemplateOutput } from './seo-templates';
import { SeoValidationService } from './seo-validation.service';

interface NamedSlugEntity {
  id: number;
  name: string;
  slug: string;
}

interface GenerateOneParams {
  pageType: SeoPageType;
  slug: string;
  sector?: string;
  role?: NamedSlugEntity;
  location?: NamedSlugEntity;
  company?: NamedSlugEntity;
  skill?: NamedSlugEntity;
}

export interface SeoGenerationSummary {
  created: number;
  updated: number;
  skippedManualOverride: number;
  belowThreshold: number;
  failedValidation: number;
}

/**
 * SRS 12.11.2 generation flow orchestrator. Triggered by the scrape-
 * completion hook (decision #7) or an admin on-demand request — not an
 * independent timer.
 */
@Injectable()
export class SeoGenerationService {
  private readonly logger = new Logger(SeoGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly seoInput: SeoInputService,
    private readonly seoLinks: SeoLinksService,
    private readonly seoValidation: SeoValidationService,
  ) {}

  async regenerateAll(): Promise<SeoGenerationSummary> {
    const summary: SeoGenerationSummary = {
      created: 0,
      updated: 0,
      skippedManualOverride: 0,
      belowThreshold: 0,
      failedValidation: 0,
    };

    const [roles, locations, skills, companies, roleLocationPairs] =
      await Promise.all([
        this.prisma.seoRole.findMany(),
        this.prisma.seoLocation.findMany(),
        this.prisma.seoSkill.findMany(),
        this.prisma.company.findMany({
          where: { jobs: { some: { status: 'ACTIVE', deletedAt: null } } },
        }),
        this.prisma.job.groupBy({
          by: ['seoRoleId', 'seoLocationId'],
          where: {
            status: 'ACTIVE',
            deletedAt: null,
            seoRoleId: { not: null },
            seoLocationId: { not: null },
          },
        }),
      ]);

    const roleById = new Map(roles.map((r) => [r.id, r]));
    const locationById = new Map(locations.map((l) => [l.id, l]));

    for (const sector of SECTORS) {
      await this.generateOne(
        {
          pageType: SeoPageType.SECTOR,
          sector,
          slug: `jobs/sector/${slugify(sector)}`,
        },
        summary,
      );
    }

    for (const role of roles) {
      await this.generateOne(
        { pageType: SeoPageType.ROLE, role, slug: `jobs/${role.slug}` },
        summary,
      );
    }

    for (const location of locations) {
      await this.generateOne(
        {
          pageType: SeoPageType.LOCATION,
          location,
          slug: `jobs/in/${location.slug}`,
        },
        summary,
      );
    }

    const liveRoleLocationSlugs = new Set<string>();
    for (const pair of roleLocationPairs) {
      const role = roleById.get(pair.seoRoleId!);
      const location = locationById.get(pair.seoLocationId!);
      if (!role || !location) continue;

      const slug = `jobs/${role.slug}/in/${location.slug}`;
      liveRoleLocationSlugs.add(slug);
      await this.generateOne(
        { pageType: SeoPageType.ROLE_LOCATION, role, location, slug },
        summary,
      );
    }
    // Combos that no longer have any jobs are skipped above — zero out their
    // cached counts so the (separately-scheduled) lifecycle evaluation sees
    // the true current state instead of a stale non-zero count.
    await this.prisma.seoPage.updateMany({
      where: {
        pageType: SeoPageType.ROLE_LOCATION,
        slug: { notIn: [...liveRoleLocationSlugs] },
      },
      data: { jobCount: 0, companyCount: 0 },
    });

    for (const skill of skills) {
      await this.generateOne(
        {
          pageType: SeoPageType.SKILL,
          skill,
          slug: `jobs/skills/${skill.slug}`,
        },
        summary,
      );
    }

    const liveCompanySlugs = companies.map((c) => `companies/${c.slug}`);
    for (const company of companies) {
      await this.generateOne(
        {
          pageType: SeoPageType.COMPANY,
          company,
          slug: `companies/${company.slug}`,
        },
        summary,
      );
    }
    await this.prisma.seoPage.updateMany({
      where: {
        pageType: SeoPageType.COMPANY,
        slug: { notIn: liveCompanySlugs },
      },
      data: { jobCount: 0, companyCount: 0 },
    });

    for (const role of roles) {
      await this.generateOne(
        {
          pageType: SeoPageType.REMOTE,
          role,
          slug: `jobs/remote/${role.slug}`,
        },
        summary,
      );
    }
    await this.generateOne(
      { pageType: SeoPageType.REMOTE, slug: 'remote-jobs' },
      summary,
    );

    await this.generateOne(
      { pageType: SeoPageType.INTERNSHIP, slug: 'internships' },
      summary,
    );

    this.logger.log(`SEO generation complete: ${JSON.stringify(summary)}`);
    return summary;
  }

  /** Regenerates a single existing page — used by the admin "Regenerate now" action. */
  async regenerateOne(pageId: number, force = false): Promise<void> {
    const page = await this.prisma.seoPage.findUniqueOrThrow({
      where: { id: pageId },
    });

    if (force && page.manualOverride) {
      await this.prisma.seoPage.update({
        where: { id: pageId },
        data: { manualOverride: false },
      });
    }

    const [role, location, company, skill] = await Promise.all([
      page.roleId
        ? this.prisma.seoRole.findUnique({ where: { id: page.roleId } })
        : null,
      page.locationId
        ? this.prisma.seoLocation.findUnique({ where: { id: page.locationId } })
        : null,
      page.companyId
        ? this.prisma.company.findUnique({ where: { id: page.companyId } })
        : null,
      page.skillId
        ? this.prisma.seoSkill.findUnique({ where: { id: page.skillId } })
        : null,
    ]);

    const summary: SeoGenerationSummary = {
      created: 0,
      updated: 0,
      skippedManualOverride: 0,
      belowThreshold: 0,
      failedValidation: 0,
    };

    await this.generateOne(
      {
        pageType: page.pageType,
        slug: page.slug,
        sector: page.sector ?? undefined,
        role: role ?? undefined,
        location: location ?? undefined,
        company: company ?? undefined,
        skill: skill ?? undefined,
      },
      summary,
    );
  }

  private async generateOne(
    params: GenerateOneParams,
    summary: SeoGenerationSummary,
  ): Promise<void> {
    const existing = await this.prisma.seoPage.findUnique({
      where: { slug: params.slug },
    });

    const input = await this.seoInput.build(params);

    if (existing?.manualOverride) {
      const jobSetChanged = existing.jobCount !== input.jobCount;
      await this.prisma.seoPage.update({
        where: { id: existing.id },
        data: {
          jobCount: input.jobCount,
          companyCount: input.companyCount,
          lastmod: jobSetChanged ? new Date() : existing.lastmod,
        },
      });
      summary.skippedManualOverride++;
      return;
    }

    const threshold = SEO_PAGE_THRESHOLDS[params.pageType];
    const meetsThreshold = input.jobCount >= threshold;
    const template = generateSeoTemplateOutput(input, params.slug);
    const canonicalUrl = `${this.config.get<string>('FRONTEND_URL')}/${params.slug}`;

    const validation = await this.seoValidation.validate({
      pageId: existing?.id,
      title: template.title,
      metaDescription: template.metaDescription,
      introText: template.introText,
      bottomText: template.bottomText,
      canonicalUrl,
      jobCount: input.jobCount,
      threshold,
    });

    // Hard gate (decision #8): validation failure forces isIndexable=false
    // regardless of the threshold result.
    const isIndexable = meetsThreshold && validation.valid;
    if (!meetsThreshold) summary.belowThreshold++;
    if (!validation.valid) summary.failedValidation++;

    const relatedLinks = await this.seoLinks.buildRelatedLinks(params);
    const jobSetChanged = !existing || existing.jobCount !== input.jobCount;

    const data: Omit<SeoPageUncheckedCreateInput, 'contentVersion'> = {
      pageType: params.pageType,
      slug: params.slug,
      sector: params.sector,
      roleId: params.role?.id,
      locationId: params.location?.id,
      companyId: params.company?.id,
      skillId: params.skill?.id,
      title: template.title,
      metaDescription: template.metaDescription,
      h1: template.h1,
      introText: template.introText,
      bottomText: template.bottomText,
      canonicalUrl,
      relatedLinksJson: relatedLinks,
      isIndexable,
      jobCount: input.jobCount,
      companyCount: input.companyCount,
      needsReview: !validation.valid,
      // An empty array (rather than `null`) for "no issues" — sidesteps
      // Prisma's JsonNull sentinel requirement for explicitly nulling a
      // nullable Json column, which a plain `null` literal doesn't satisfy.
      validationIssues: validation.valid ? [] : validation.issues,
      lastGeneratedAt: new Date(),
      lastmod: jobSetChanged ? new Date() : (existing?.lastmod ?? new Date()),
    };

    if (existing) {
      await this.prisma.seoPage.update({
        where: { id: existing.id },
        data: { ...data, contentVersion: { increment: 1 } },
      });
      summary.updated++;
    } else {
      await this.prisma.seoPage.create({
        data: { ...data, contentVersion: 1 },
      });
      summary.created++;
    }
  }
}
