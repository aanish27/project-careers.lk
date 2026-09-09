import { PrismaService } from '@/database/prisma.service';
import type { JobWhereInput } from '@careerslk/database';
import {
  AppType,
  JobApprovalStatus,
  JobStatus,
  SeoPageType,
} from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import { buildJobWhereForPage } from './seo-query.util';

const PAGE_JOB_LISTING_LIMIT = 20;

const FEATURED_DISTRICTS = ['Colombo', 'Kandy', 'Galle', 'Jaffna'];

const PUBLIC_JOB_WHERE: JobWhereInput = {
  status: JobStatus.ACTIVE,
  deletedAt: null,
  approvalStatus: JobApprovalStatus.APPROVED,
  NOT: { employmentType: { equals: 'talent_pool', mode: 'insensitive' } },
};

@Injectable()
export class SeoPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic(appType: AppType) {
    if (appType !== AppType.JOBS) return null;

    const [totalJobs, totalCompanies, bySector, byDistrict] = await Promise.all(
      [
        this.prisma.job.count({ where: PUBLIC_JOB_WHERE }),
        this.prisma.company.count({
          where: { jobs: { some: PUBLIC_JOB_WHERE } },
        }),
        this.prisma.job.groupBy({
          by: ['sector'],
          where: { ...PUBLIC_JOB_WHERE, sector: { not: null } },
          _count: { _all: true },
        }),
        this.prisma.job.groupBy({
          by: ['district'],
          where: {
            ...PUBLIC_JOB_WHERE,
            district: { in: FEATURED_DISTRICTS },
          },
          _count: { _all: true },
        }),
      ],
    );

    return {
      stats: {
        totalJobs,
        totalCompanies,
        bySector: bySector.map((row) => ({
          sector: row.sector as string,
          count: row._count._all,
        })),
        byLocation: FEATURED_DISTRICTS.map((district) => ({
          district,
          count:
            byDistrict.find((row) => row.district === district)?._count._all ??
            0,
        })),
      },
    };
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.seoPage.findUnique({
      where: { slug },
      include: { location: { select: { name: true, level: true } } },
    });
    if (!page) return null;

    const relatedSlugs = Array.isArray(page.relatedLinksJson)
      ? (page.relatedLinksJson as unknown[]).filter(
          (s): s is string => typeof s === 'string',
        )
      : [];

    const [jobs, relatedLinks] = await Promise.all([
      this.prisma.job.findMany({
        where: buildJobWhereForPage({
          pageType: page.pageType as SeoPageType,
          sector: page.sector,
          roleId: page.roleId,
          location: page.location,
          companyId: page.companyId,
          skillId: page.skillId,
        }),
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true, slug: true },
          },
        },
        orderBy: { lastSeenAt: 'desc' },
        take: PAGE_JOB_LISTING_LIMIT,
      }),
      relatedSlugs.length > 0
        ? this.prisma.seoPage.findMany({
            where: { slug: { in: relatedSlugs }, isIndexable: true },
            select: { slug: true, title: true, h1: true },
          })
        : Promise.resolve([]),
    ]);

    return { page, jobs, relatedLinks };
  }

  async getSeoContent(slug: string) {
    const page = await this.prisma.seoPage.findUnique({
      where: { slug },
      include: { location: { select: { name: true, level: true } } },
    });
    if (!page) return null;

    const relatedSlugs = Array.isArray(page.relatedLinksJson)
      ? (page.relatedLinksJson as unknown[]).filter(
          (s): s is string => typeof s === 'string',
        )
      : [];

    const relatedLinks =
      relatedSlugs.length > 0
        ? await this.prisma.seoPage.findMany({
            where: { slug: { in: relatedSlugs }, isIndexable: true },
            select: { slug: true, title: true, h1: true },
          })
        : [];

    return { page, relatedLinks };
  }

  async isRetired(slug: string): Promise<boolean> {
    const page = await this.prisma.seoPage.findUnique({
      where: { slug },
      select: { retiredAt: true },
    });
    return page?.retiredAt !== null && page?.retiredAt !== undefined;
  }

  async list(pageType?: SeoPageType) {
    return this.prisma.seoPage.findMany({
      where: {
        isIndexable: true,
        retiredAt: null,
        ...(pageType ? { pageType } : {}),
      },
      select: { slug: true, pageType: true, lastmod: true },
    });
  }
}
