import {
  FreelanceApprovalStatus,
  generateUniqueSlug,
  PrismaClient,
} from '@careerslk/database';
import type { WebUser } from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import { FREELANCE_CATEGORY_TAXONOMY } from '@careerslk/types';
import { faker } from '@faker-js/faker';
import { SALARY_CURRENCY } from './data.ts';

const FREELANCE_CATEGORIES = Object.keys(
  FREELANCE_CATEGORY_TAXONOMY,
) as (keyof typeof FREELANCE_CATEGORY_TAXONOMY)[];

const REJECTION_REASONS = [
  'Bio is too short to give clients a sense of your work — please add more detail.',
  'Portfolio links did not resolve — please double-check and resubmit.',
  'This looks like a duplicate of an existing profile.',
];

function buildWorkHistory() {
  const entryCount = faker.number.int({ min: 0, max: 3 });

  return Array.from({ length: entryCount }, () => {
    const startDate = faker.date.past({ years: 6 });
    const isCurrent = faker.datatype.boolean({ probability: 0.2 });

    return {
      title: faker.person.jobTitle(),
      organization: faker.company.name(),
      description: faker.lorem.sentence(),
      startDate: startDate.toISOString().slice(0, 10),
      ...(isCurrent
        ? {}
        : {
            endDate: faker.date
              .between({ from: startDate, to: new Date() })
              .toISOString()
              .slice(0, 10),
          }),
    };
  });
}

// One profile per web user (schema enforces `webUserId` unique) — callers
// should pass a slice of web users with no existing profile.
export async function seedFreelanceProfiles(
  prisma: PrismaClient,
  candidateWebUsers: WebUser[],
  count: number,
  reviewingAdminId: number,
) {
  console.log(`Seeding ${count} freelance profiles...`);

  const webUsers = faker.helpers.arrayElements(
    candidateWebUsers,
    Math.min(count, candidateWebUsers.length),
  );
  const profiles = [];

  for (const webUser of webUsers) {
    const category = faker.helpers.arrayElement(FREELANCE_CATEGORIES);
    const skills = faker.helpers.arrayElements(
      FREELANCE_CATEGORY_TAXONOMY[category],
      {
        min: 2,
        max: Math.min(4, FREELANCE_CATEGORY_TAXONOMY[category].length),
      },
    );

    const nameForSlug =
      [webUser.firstName, webUser.lastName].filter(Boolean).join(' ') ||
      webUser.email.split('@')[0]!;
    const slug = await generateUniqueSlug(slugify(nameForSlug), (candidate) =>
      prisma.freelanceProfile
        .findUnique({ where: { slug: candidate } })
        .then((existing) => existing !== null),
    );

    const approvalStatus = faker.helpers.weightedArrayElement([
      { value: FreelanceApprovalStatus.APPROVED, weight: 7 },
      { value: FreelanceApprovalStatus.PENDING, weight: 2 },
      { value: FreelanceApprovalStatus.REJECTED, weight: 1 },
    ]);

    const profile = await prisma.freelanceProfile.upsert({
      where: { webUserId: webUser.id },
      update: {},
      create: {
        webUserId: webUser.id,
        bio: faker.lorem.paragraphs(2, '\n\n'),
        rate: faker.number.int({ min: 2000, max: 15000 }),
        rateCurrency: SALARY_CURRENCY,
        category,
        skills,
        portfolioLinks: Array.from(
          { length: faker.number.int({ min: 0, max: 3 }) },
          () => faker.internet.url(),
        ),
        workHistory: buildWorkHistory(),
        slug,
        approvalStatus,
        ...(approvalStatus === FreelanceApprovalStatus.APPROVED && {
          approvedByAdminId: reviewingAdminId,
          approvedAt: faker.date.recent({ days: 20 }),
        }),
        ...(approvalStatus === FreelanceApprovalStatus.REJECTED && {
          rejectionReason: faker.helpers.arrayElement(REJECTION_REASONS),
          internalReviewNotes:
            'Flagged during routine review — resubmission welcome.',
        }),
      },
    });

    profiles.push(profile);
  }

  console.log(`  Seeded ${profiles.length} freelance profiles`);
  return profiles;
}
