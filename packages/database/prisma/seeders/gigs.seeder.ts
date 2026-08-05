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

const GIG_TITLE_TEMPLATES = [
  'Build a {category} MVP',
  'Redesign our {category} deliverables',
  'Ongoing {category} support (part-time)',
  'One-off {category} project',
  'Looking for a {category} freelancer for a 2-week sprint',
];

const REJECTION_REASONS = [
  'Description is too vague for freelancers to scope the work.',
  'Budget range looks like a placeholder — please confirm real numbers.',
  'This looks like a duplicate posting.',
];

function buildTitle(category: string): string {
  const template = faker.helpers.arrayElement(GIG_TITLE_TEMPLATES);
  return template.replace('{category}', category);
}

// `postedByWebUserId` has no uniqueness constraint (unlike FreelanceProfile),
// so the same web user may post multiple gigs — pass any pool of web users.
export async function seedGigs(
  prisma: PrismaClient,
  candidateWebUsers: WebUser[],
  count: number,
  reviewingAdminId: number,
) {
  console.log(`Seeding ${count} gigs...`);

  const gigs = [];

  for (let i = 0; i < count; i++) {
    const webUser = faker.helpers.arrayElement(candidateWebUsers);
    const category = faker.helpers.arrayElement(FREELANCE_CATEGORIES);
    const skills = faker.helpers.arrayElements(
      FREELANCE_CATEGORY_TAXONOMY[category],
      {
        min: 1,
        max: Math.min(3, FREELANCE_CATEGORY_TAXONOMY[category].length),
      },
    );
    const title = buildTitle(category);

    const budgetMin = faker.number.int({ min: 10000, max: 50000 });
    const hasRange = faker.datatype.boolean({ probability: 0.7 });

    const slug = await generateUniqueSlug(slugify(title), (candidate) =>
      prisma.gig
        .findUnique({ where: { slug: candidate } })
        .then((existing) => existing !== null),
    );

    const approvalStatus = faker.helpers.weightedArrayElement([
      { value: FreelanceApprovalStatus.APPROVED, weight: 7 },
      { value: FreelanceApprovalStatus.PENDING, weight: 2 },
      { value: FreelanceApprovalStatus.REJECTED, weight: 1 },
    ]);

    const gig = await prisma.gig.create({
      data: {
        postedByWebUserId: webUser.id,
        title,
        description: faker.lorem.paragraphs(2, '\n\n'),
        category,
        skills,
        budgetMin,
        budgetMax: hasRange
          ? budgetMin + faker.number.int({ min: 5000, max: 40000 })
          : null,
        budgetCurrency: SALARY_CURRENCY,
        deadline: faker.datatype.boolean({ probability: 0.6 })
          ? faker.date.soon({ days: 90 })
          : null,
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

    gigs.push(gig);
  }

  console.log(`  Seeded ${gigs.length} gigs`);
  return gigs;
}
