import { PrismaService } from '@/database/prisma.service';
import { SeoPageType } from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import { buildJobWhereForPage } from './seo-query.util';

const PAGE_JOB_LISTING_LIMIT = 20;

@Injectable()
export class SeoPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const page = await this.prisma.seoPage.findUnique({ where: { slug } });
    if (!page) return null;

    const relatedSlugs = Array.isArray(page.relatedLinksJson)
      ? (page.relatedLinksJson as unknown[]).filter(
          (s): s is string => typeof s === 'string',
        )
      : [];

    const [jobs, relatedLinks] = await Promise.all([
      this.prisma.job.findMany({
        where: buildJobWhereForPage({
          pageType: page.pageType,
          roleId: page.roleId,
          locationId: page.locationId,
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
