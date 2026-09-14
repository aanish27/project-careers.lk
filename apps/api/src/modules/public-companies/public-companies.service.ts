import { PrismaService } from '@/database/prisma.service';
import { CompanyStatus, JobApprovalStatus, JobStatus } from '@careerslk/types';
import { Injectable, NotFoundException } from '@nestjs/common';

const COMPANY_JOBS_LIMIT = 50;

@Injectable()
export class PublicCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findFirst({
      where: { slug, status: CompanyStatus.ACTIVE, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        websiteUrl: true,
        description: true,
        linkedinUrl: true,
        twitterUrl: true,
        facebookUrl: true,
        instagramUrl: true,
      },
    });
    if (!company) throw new NotFoundException('Company not found');

    const activeJobCount = await this.prisma.job.count({
      where: {
        companyId: company.id,
        status: JobStatus.ACTIVE,
        approvalStatus: JobApprovalStatus.APPROVED,
        deletedAt: null,
        NOT: { employmentType: { equals: 'talent_pool', mode: 'insensitive' } },
      },
    });

    return { company, activeJobCount };
  }

  async findJobsBySlug(slug: string) {
    const company = await this.prisma.company.findFirst({
      where: { slug, status: CompanyStatus.ACTIVE, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        websiteUrl: true,
        description: true,
        linkedinUrl: true,
        twitterUrl: true,
        facebookUrl: true,
        instagramUrl: true,
      },
    });
    if (!company) throw new NotFoundException('Company not found');

    const jobs = await this.prisma.job.findMany({
      where: {
        companyId: company.id,
        status: JobStatus.ACTIVE,
        approvalStatus: JobApprovalStatus.APPROVED,
        deletedAt: null,
        NOT: { employmentType: { equals: 'talent_pool', mode: 'insensitive' } },
      },
      include: { skills: { select: { name: true, type: true } } },
      orderBy: { lastSeenAt: 'desc' },
      take: COMPANY_JOBS_LIMIT,
    });

    // Every job here belongs to the same company already fetched above —
    // reuse it instead of joining it onto each row.
    return { company, jobs: jobs.map((job) => ({ ...job, company })) };
  }
}
