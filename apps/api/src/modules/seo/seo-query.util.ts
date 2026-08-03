import type { JobWhereInput } from '@careerslk/database';
import { JobStatus, SeoPageType } from '@careerslk/types';

export interface SeoPageDimensions {
  pageType: SeoPageType;
  sector?: string | null;
  roleId?: number | null;
  locationId?: number | null;
  companyId?: number | null;
  skillId?: number | null;
}

/**
 * Single source of truth for "what jobs does this page represent" — used
 * both to aggregate SEO Input Object stats and to list jobs on the public
 * page itself, so the displayed count always matches the displayed jobs.
 */
export function buildJobWhereForPage(dims: SeoPageDimensions): JobWhereInput {
  const where: JobWhereInput = { status: JobStatus.ACTIVE, deletedAt: null };

  if (dims.sector) where.sector = dims.sector;
  if (dims.roleId) where.seoRoleId = dims.roleId;
  if (dims.locationId) where.seoLocationId = dims.locationId;
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
