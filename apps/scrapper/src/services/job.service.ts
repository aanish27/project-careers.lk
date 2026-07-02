import { prisma } from '../utils/prisma';
import { AiJob } from '../utils/types';
import { HashService } from './hash.service';

export function buildJobFingerprint(companyId: number, job: AiJob): string {
  return HashService.hash([companyId, job.title, job.apply_url].join('|'));
}

export async function upsertJobs(
  companyId: number,
  jobs: AiJob[],
): Promise<number> {
  if (jobs.length === 0) return 0;

  await Promise.all(
    jobs.map((job) => {
      const fingerprint = buildJobFingerprint(companyId, job);
      return prisma.job.upsert({
        where: { fingerprint },
        update: { lastSeenAt: new Date() },
        create: {
          title: job.title,
          applyUrl: job.apply_url,
          description: job.description,
          department: job.department,
          roleCategory: job.role_category,
          workMode: job.work_mode,
          location: job.location,
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
    }),
  );

  return jobs.length;
}
