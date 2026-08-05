import type { JobWhereInput } from '@careerslk/database';
import { JobStatus, LocationLevel, SeoPageType } from '@careerslk/types';

export interface SeoPageDimensions {
  pageType: SeoPageType;
  sector?: string | null;
  roleId?: number | null;
  location?: { name: string; level: LocationLevel } | null;
  companyId?: number | null;
  skillId?: number | null;
}

/**
 * Single source of truth for "what jobs does this page represent" — used
 * both to aggregate SEO Input Object stats and to list jobs on the public
 * page itself, so the displayed count always matches the displayed jobs.
 *
 * Location matching is hierarchy-aware: a district page rolls up every city
 * within it, a province page rolls up every district/city within it — a
 * plain `seoLocationId` equality check can't express that roll-up, so this
 * matches directly on the job's own `province`/`district`/`city` string
 * columns instead.
 */
export function buildJobWhereForPage(dims: SeoPageDimensions): JobWhereInput {
  const where: JobWhereInput = { status: JobStatus.ACTIVE, deletedAt: null };

  if (dims.sector) where.sector = dims.sector;
  if (dims.roleId) where.seoRoleId = dims.roleId;
  if (dims.location) {
    switch (dims.location.level) {
      case LocationLevel.CITY:
        where.city = dims.location.name;
        break;
      case LocationLevel.DISTRICT:
        where.district = dims.location.name;
        break;
      case LocationLevel.PROVINCE:
        where.province = dims.location.name;
        break;
    }
  }
  if (dims.companyId) where.companyId = dims.companyId;
  if (dims.skillId) {
    where.skills = { some: { seoSkillId: dims.skillId } };
  }

  if (dims.pageType === SeoPageType.REMOTE) {
    where.workMode = { equals: 'remote', mode: 'insensitive' };
  }
  if (dims.pageType === SeoPageType.INTERNSHIP) {
    where.employmentType = { equals: 'internship', mode: 'insensitive' };
  }

  return where;
}
