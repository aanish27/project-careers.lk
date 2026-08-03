import { PrismaService } from '@/database/prisma.service';
import { CompanyStatus, JobStatus } from '@careerslk/types';
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
      },
    });
    if (!company) throw new NotFoundException('Company not found');

    const activeJobCount = await this.prisma.job.count({
      where: {
        companyId: company.id,
        status: JobStatus.ACTIVE,
        deletedAt: null,
      },
    });

    return { company, activeJobCount };
  }

  async findJobsBySlug(slug: string) {
    const company = await this.prisma.company.findFirst({
      where: { slug, status: CompanyStatus.ACTIVE, deletedAt: null },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const jobs = await this.prisma.job.findMany({
      where: {
        companyId: company.id,
        status: JobStatus.ACTIVE,
        deletedAt: null,
      },
      include: { skills: { select: { name: true, type: true } } },
      orderBy: { lastSeenAt: 'desc' },
      take: COMPANY_JOBS_LIMIT,
    });

    return { company, jobs };
  }
}
