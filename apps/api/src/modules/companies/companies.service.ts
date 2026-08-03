import { PrismaService } from '@/database/prisma.service';
import { AUDIT_ACTIONS } from '@/modules/audit/audit.constant';
import { AuditContext, AuditService } from '@/modules/audit/audit.service';
import { generateUniqueSlug } from '@careerslk/database';
import { assertNotSsrf } from '@careerslk/lib/ssrf';
import { slugify } from '@careerslk/lib/slugify';
import {
  CompanyScrapeSummary,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '@careerslk/types';
import { Injectable } from '@nestjs/common';

interface LatestScrapeLogRow {
  companyId: number;
  id: number;
  status: string;
  jobsFound: number;
  errorMessage: string | null;
  durationMs: number;
  createdAt: Date;
}

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getScrapeSummaries(
    companyIds?: number[],
  ): Promise<CompanyScrapeSummary[]> {
    const companyWhere = {
      deletedAt: null,
      ...(companyIds ? { id: { in: companyIds } } : {}),
    };

    const companies = await this.prisma.company.findMany({
      where: companyWhere,
      select: { id: true, name: true },
    });
    if (companies.length === 0) return [];

    const ids = companies.map((c) => c.id);

    const [jobCounts, latestScrapeLogs] = await Promise.all([
      this.prisma.job.groupBy({
        by: ['companyId', 'status'],
        where: { companyId: { in: ids }, deletedAt: null },
        _count: { _all: true },
      }),
      // Prisma's groupBy can't return sibling columns for a per-group max
      // row, so DISTINCT ON is the correct tool for "latest scrape per company".
      this.prisma.$queryRaw<LatestScrapeLogRow[]>`
        SELECT DISTINCT ON ("companyId")
          "companyId", "id", "status", "jobsFound", "errorMessage", "durationMs", "createdAt"
        FROM "ScrapeLog"
        WHERE "companyId" = ANY(${ids})
        ORDER BY "companyId", "createdAt" DESC
      `,
    ]);

    const jobCountsByCompany = new Map<
      number,
      { active: number; expired: number }
    >();
    for (const row of jobCounts) {
      const entry = jobCountsByCompany.get(row.companyId) ?? {
        active: 0,
        expired: 0,
      };
      if (row.status === 'ACTIVE') entry.active += row._count._all;
      if (row.status === 'EXPIRED') entry.expired += row._count._all;
      jobCountsByCompany.set(row.companyId, entry);
    }

    const latestScrapeByCompany = new Map(
      latestScrapeLogs.map((row) => [row.companyId, row]),
    );

    return companies.map((company) => {
      const counts = jobCountsByCompany.get(company.id) ?? {
        active: 0,
        expired: 0,
      };
      const latest = latestScrapeByCompany.get(company.id) ?? null;

      return {
        companyId: company.id,
        companyName: company.name,
        activeJobs: counts.active,
        expiredJobs: counts.expired,
        lastScrape: latest
          ? {
              id: latest.id,
              status: latest.status,
              jobsFound: latest.jobsFound,
              errorMessage: latest.errorMessage,
              durationMs: latest.durationMs,
              createdAt: latest.createdAt.toISOString(),
            }
          : null,
      };
    });
  }

  private assertUrlsNotSsrf(...urls: (string | undefined)[]) {
    return Promise.all(
      urls.filter((url): url is string => !!url).map(assertNotSsrf),
    );
  }

  async create(dto: CreateCompanyInput, context: AuditContext) {
    await this.assertUrlsNotSsrf(dto.careerUrl, dto.websiteUrl, dto.logoUrl);

    return await this.prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(slugify(dto.name), (candidate) =>
        tx.company
          .findUnique({ where: { slug: candidate } })
          .then((existing) => existing !== null),
      );

      const company = await tx.company.create({
        data: {
          name: dto.name,
          slug,
          websiteUrl: dto.websiteUrl,
          logoUrl: dto.logoUrl,
          careerUrl: dto.careerUrl,
          atsPlatform: dto.atsPlatform,
          htmlSelector: dto.htmlSelector,
          htmlSelectorType: dto.htmlSelectorType,
          status: dto.status,
          paginationType: dto.paginationType,
          paginationBtn: dto.paginationBtn,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.COMPANY_CREATED,
          entityType: 'company',
          entityId: company.id,
          newValue: { name: company.name, websiteUrl: company.websiteUrl },
        },
        tx,
      );

      return company;
    });
  }

  async findAll() {
    return await this.prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findFirstOrThrow({
      where: { id, deletedAt: null },
    });
    const [scrapeSummary] = await this.getScrapeSummaries([id]);

    return { ...company, scrapeSummary: scrapeSummary ?? null };
  }

  async update(id: number, dto: UpdateCompanyInput, context: AuditContext) {
    await this.assertUrlsNotSsrf(dto.careerUrl, dto.websiteUrl, dto.logoUrl);

    return await this.prisma.$transaction(async (tx) => {
      const before = await tx.company.findFirstOrThrow({
        where: { id, deletedAt: null },
      });

      const company = await tx.company.update({
        where: { id },
        data: {
          name: dto.name,
          websiteUrl: dto.websiteUrl,
          logoUrl: dto.logoUrl,
          careerUrl: dto.careerUrl,
          atsPlatform: dto.atsPlatform,
          htmlSelector: dto.htmlSelector,
          htmlSelectorType: dto.htmlSelectorType,
          status: dto.status,
          paginationType: dto.paginationType,
          paginationBtn: dto.paginationBtn,
        },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.COMPANY_UPDATED,
          entityType: 'company',
          entityId: company.id,
          oldValue: { name: before.name, status: before.status },
          newValue: { name: company.name, status: company.status },
        },
        tx,
      );

      return company;
    });
  }

  async softDelete(id: number, context: AuditContext) {
    return await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.audit.record(
        context,
        {
          action: AUDIT_ACTIONS.COMPANY_DELETED,
          entityType: 'company',
          entityId: company.id,
          oldValue: { name: company.name },
        },
        tx,
      );

      return company;
    });
  }
}
