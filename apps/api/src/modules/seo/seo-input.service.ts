import { PrismaService } from '@/database/prisma.service';
import { LocationLevel, SeoInputObject, SeoPageType } from '@careerslk/types';
import { Injectable } from '@nestjs/common';
import { buildJobWhereForPage } from './seo-query.util';

interface NamedEntity {
  id: number;
  name: string;
}

export interface NamedLocationEntity extends NamedEntity {
  level: LocationLevel;
}

export interface BuildSeoInputParams {
  pageType: SeoPageType;
  sector?: string;
  role?: NamedEntity;
  location?: NamedLocationEntity;
  company?: NamedEntity;
  skill?: NamedEntity;
}

const TOP_SKILLS_LIMIT = 5;

@Injectable()
export class SeoInputService {
  constructor(private readonly prisma: PrismaService) {}

  async build(params: BuildSeoInputParams): Promise<SeoInputObject> {
    const where = buildJobWhereForPage({
      pageType: params.pageType,
      sector: params.sector,
      roleId: params.role?.id,
      location: params.location
        ? { name: params.location.name, level: params.location.level }
        : undefined,
      companyId: params.company?.id,
      skillId: params.skill?.id,
    });

    const [
      jobCount,
      distinctCompanies,
      distinctEmploymentTypes,
      distinctWorkModes,
      topSkillRows,
    ] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        select: { companyId: true },
        distinct: ['companyId'],
      }),
      this.prisma.job.findMany({
        where,
        select: { employmentType: true },
        distinct: ['employmentType'],
      }),
      this.prisma.job.findMany({
        where,
        select: { workMode: true },
        distinct: ['workMode'],
      }),
      this.prisma.jobSkill.groupBy({
        by: ['name'],
        where: { job: where },
        _count: { name: true },
        orderBy: { _count: { name: 'desc' } },
        take: TOP_SKILLS_LIMIT,
      }),
    ]);

    return {
      pageType: params.pageType,
      sector: params.sector,
      role: params.role?.name,
      location: params.location?.name,
      company: params.company?.name,
      skill: params.skill?.name,
      jobCount,
      companyCount: distinctCompanies.length,
      topSkills: topSkillRows.map((row) => row.name),
      jobTypes: distinctEmploymentTypes
        .map((row) => row.employmentType)
        .filter((value): value is string => !!value),
      workModes: distinctWorkModes
        .map((row) => row.workMode)
        .filter((value): value is string => !!value),
    };
  }
}
