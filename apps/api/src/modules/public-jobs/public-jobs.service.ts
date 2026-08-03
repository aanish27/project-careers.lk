import { PrismaService } from '@/database/prisma.service';
import type { JobWhereInput } from '@careerslk/database';
import { JobStatus } from '@careerslk/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FilterPublicJobsDto } from './dto/filter-public-jobs.dto';

interface JobCursor {
  lastSeenAt: string;
  id: number;
}

function encodeJobCursor(cursor: JobCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

function decodeJobCursor(cursor: string): JobCursor {
  return JSON.parse(
    Buffer.from(cursor, 'base64').toString('utf-8'),
  ) as JobCursor;
}

const JOB_LIST_INCLUDE = {
  company: { select: { id: true, name: true, slug: true, logoUrl: true } },
  skills: { select: { name: true, type: true } },
} as const;

const RELATED_JOBS_LIMIT = 5;

@Injectable()
export class PublicJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterPublicJobsDto) {
    const and: JobWhereInput[] = [
      { status: JobStatus.ACTIVE, deletedAt: null },
    ];

    if (filters.location) {
      and.push({
        location: { contains: filters.location, mode: 'insensitive' },
      });
    }
    if (filters.sector) and.push({ sector: filters.sector });
    if (filters.workMode?.length) {
      and.push({ workMode: { in: filters.workMode, mode: 'insensitive' } });
    }
    if (filters.employmentType?.length) {
      and.push({
        employmentType: { in: filters.employmentType, mode: 'insensitive' },
      });
    }
    if (filters.companyId) and.push({ companyId: filters.companyId });
    if (filters.company) {
      and.push({
        company: { name: { contains: filters.company, mode: 'insensitive' } },
      });
    }
    // Salary filters only ever match jobs that actually have salary data
    // (SRS 5.5.3: "only shows jobs with salary data"), matched by overlap
    // between the requested range and the job's own salary range.
    if (filters.salaryMin !== undefined) {
      and.push({
        salaryMax: { gte: filters.salaryMin },
        salaryMin: { not: null },
      });
    }
    if (filters.salaryMax !== undefined) {
      and.push({
        salaryMin: { lte: filters.salaryMax },
        salaryMax: { not: null },
      });
    }
    if (filters.skills?.length) {
      and.push({
        skills: { some: { name: { in: filters.skills, mode: 'insensitive' } } },
      });
    }
    if (filters.keywords?.length) {
      and.push({
        keywords: {
          some: {
            keyword: { name: { in: filters.keywords, mode: 'insensitive' } },
          },
        },
      });
    }
    if (filters.q) {
      and.push({
        OR: [
          { title: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
          { company: { name: { contains: filters.q, mode: 'insensitive' } } },
          {
            skills: {
              some: { name: { contains: filters.q, mode: 'insensitive' } },
            },
          },
          {
            keywords: {
              some: {
                keyword: { name: { contains: filters.q, mode: 'insensitive' } },
              },
            },
          },
        ],
      });
    }
    if (filters.cursor) {
      const cursor = decodeJobCursor(filters.cursor);
      and.push({
        OR: [
          { lastSeenAt: { lt: new Date(cursor.lastSeenAt) } },
          { lastSeenAt: new Date(cursor.lastSeenAt), id: { lt: cursor.id } },
        ],
      });
    }

    const take = filters.limit + 1;
    const jobs = await this.prisma.job.findMany({
      where: { AND: and },
      include: JOB_LIST_INCLUDE,
      orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }],
      take,
    });

    const hasMore = jobs.length > filters.limit;
    if (hasMore) jobs.pop();

    const last = jobs[jobs.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeJobCursor({
            lastSeenAt: last.lastSeenAt.toISOString(),
            id: last.id,
          })
        : null;

    return { items: jobs, nextCursor };
  }

  async findBySlug(slug: string) {
    const match = slug.match(/-(\d+)$/);
    if (!match) throw new NotFoundException('Job not found');
    const id = parseInt(match[1], 10);

    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
          },
        },
        skills: { select: { name: true, type: true } },
        keywords: { select: { keyword: { select: { id: true, name: true } } } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    const [sameCompanyJobs, sameRoleJobs] = await Promise.all([
      this.prisma.job.findMany({
        where: {
          companyId: job.companyId,
          id: { not: job.id },
          status: JobStatus.ACTIVE,
          deletedAt: null,
        },
        take: RELATED_JOBS_LIMIT,
        orderBy: { lastSeenAt: 'desc' },
        select: { id: true, slug: true, title: true },
      }),
      job.roleCategory
        ? this.prisma.job.findMany({
            where: {
              roleCategory: job.roleCategory,
              id: { not: job.id },
              status: JobStatus.ACTIVE,
              deletedAt: null,
            },
            take: RELATED_JOBS_LIMIT,
            orderBy: { lastSeenAt: 'desc' },
            select: {
              id: true,
              slug: true,
              title: true,
              company: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    return {
      job,
      canonicalSlug: job.slug,
      isStaleSlug: job.slug !== slug,
      relatedJobs: { sameCompany: sameCompanyJobs, sameRole: sameRoleJobs },
    };
  }
}
