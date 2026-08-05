import { slugify } from '@careerslk/lib/slugify';
import {
  getCitySlug,
  getDistrictForCity,
  getProvinceForDistrict,
  getSectorForCategory,
} from '@careerslk/types';
import { prisma } from '../utils/prisma';
import { AiJob } from '../utils/types';
import { HashService } from './hash.service';

export function buildJobFingerprint(companyId: number, job: AiJob): string {
  return HashService.hash([companyId, job.title, job.apply_url].join('|'));
}

interface SeoLookupMaps {
  roleIdBySlug: Map<string, number>;
  locationIdBySlug: Map<string, number>;
}

async function loadSeoLookupMaps(): Promise<SeoLookupMaps> {
  const [roles, locations] = await Promise.all([
    prisma.seoRole.findMany({ select: { id: true, slug: true } }),
    prisma.seoLocation.findMany({ select: { id: true, slug: true } }),
  ]);

  return {
    roleIdBySlug: new Map(roles.map((r) => [r.slug, r.id])),
    locationIdBySlug: new Map(locations.map((l) => [l.slug, l.id])),
  };
}

export async function upsertJobs(
  companyId: number,
  jobs: AiJob[],
): Promise<number> {
  if (jobs.length === 0) return 0;

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { name: true },
  });
  const seoLookups = await loadSeoLookupMaps();

  await Promise.all(
    jobs.map(async (job) => {
      const fingerprint = buildJobFingerprint(companyId, job);
      // district/province are never asked of the AI — derived deterministically
      // from the classified city, same as `sector` from `role_category`.
      const district = getDistrictForCity(job.city);
      const province = getProvinceForDistrict(district);
      const citySlug = getCitySlug(job.city);

      const upserted = await prisma.job.upsert({
        where: { fingerprint },
        update: { lastSeenAt: new Date() },
        create: {
          title: job.title,
          // Real slug depends on the autoincrement id, patched in below.
          slug: `pending-${fingerprint}`,
          applyUrl: job.apply_url,
          description: job.description,
          roleCategory: job.role_category,
          sector: getSectorForCategory(job.role_category),
          seoRoleId: job.role_category
            ? seoLookups.roleIdBySlug.get(slugify(job.role_category))
            : undefined,
          seoLocationId: citySlug
            ? seoLookups.locationIdBySlug.get(citySlug)
            : undefined,
          workMode: job.work_mode,
          location: job.location,
          city: job.city,
          district,
          province,
          employmentType: job.employment_type,
          company: { connect: { id: companyId } },
          lastSeenAt: new Date(),
          fingerprint,
          keywords: {
            createMany: {
              data: (job.keywords ?? []).map((keyword) => ({ keyword })),
            },
          },
        },
      });

      if (upserted.slug.startsWith('pending-')) {
        await prisma.job.update({
          where: { id: upserted.id },
          data: {
            slug: `${slugify(job.title)}-${slugify(company.name)}-${upserted.id}`,
          },
        });
      }
    }),
  );

  return jobs.length;
}
