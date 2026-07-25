import { JobStatus, PrismaClient, SkillType } from '@careerslk/database';
import type { Company } from '@careerslk/database';
import { faker } from '@faker-js/faker';
import { createHash } from 'node:crypto';
import {
  DEPARTMENTS,
  EXPLICIT_SKILLS,
  KEYWORD_POOL,
  ROLE_CATEGORIES,
  SALARY_CURRENCY,
  SRI_LANKAN_CITIES,
} from './data.ts';

const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'freelance',
];

const WORK_MODES = ['hybrid', 'remote', 'onsite'];

function fingerprint(companyId: number, title: string, applyUrl: string) {
  return createHash('md5')
    .update([companyId, title, applyUrl].join('|'))
    .digest('hex');
}

export async function seedKeywords(prisma: PrismaClient) {
  const keywords = await Promise.all(
    KEYWORD_POOL.map((name) =>
      prisma.keyword.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  return new Map(keywords.map((keyword) => [keyword.name, keyword.id]));
}

async function seedJobForCompany(
  prisma: PrismaClient,
  company: Company,
  keywordIds: Map<string, number>,
) {
  const title = faker.person.jobTitle();
  const applyUrl = `${company.careerUrl}/${faker.helpers.slugify(title).toLowerCase()}-${faker.string.numeric(6)}`;
  const status = faker.helpers.weightedArrayElement([
    { value: JobStatus.ACTIVE, weight: 7 },
    { value: JobStatus.EXPIRED, weight: 3 },
  ]);
  const hasSalary = faker.datatype.boolean({ probability: 0.5 });
  const salaryMin = hasSalary
    ? faker.number.int({ min: 50_000, max: 200_000 })
    : null;

  const job = await prisma.job.upsert({
    where: { fingerprint: fingerprint(company.id, title, applyUrl) },
    update: {},
    create: {
      companyId: company.id,
      fingerprint: fingerprint(company.id, title, applyUrl),
      title,
      location: faker.datatype.boolean({ probability: 0.85 })
        ? `${faker.helpers.arrayElement(SRI_LANKAN_CITIES)}, Sri Lanka`
        : null,
      workMode: faker.helpers.arrayElement(WORK_MODES),
      employmentType: faker.helpers.arrayElement(EMPLOYMENT_TYPES),
      roleCategory: faker.helpers.arrayElement(ROLE_CATEGORIES),
      department: faker.helpers.arrayElement(DEPARTMENTS),
      salaryMin,
      salaryMax: hasSalary
        ? salaryMin! + faker.number.int({ min: 20_000, max: 100_000 })
        : null,
      salaryCurrency: hasSalary ? SALARY_CURRENCY : null,
      salaryRaw: hasSalary
        ? `${SALARY_CURRENCY} ${salaryMin} - negotiable`
        : null,
      description: faker.lorem.paragraphs({ min: 1, max: 3 }, '\n\n'),
      deadline:
        status === JobStatus.ACTIVE
          ? faker.date.soon({ days: 45 })
          : faker.date.recent({ days: 30 }),
      applyUrl,
      status,
      lastSeenAt:
        status === JobStatus.ACTIVE
          ? faker.date.recent({ days: 3 })
          : faker.date.recent({ days: 60 }),
    },
  });

  await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });

  const explicitSkills = faker.helpers.arrayElements(EXPLICIT_SKILLS, {
    min: 2,
    max: 6,
  });
  const inferredSkills = faker.helpers.arrayElements(EXPLICIT_SKILLS, {
    min: 0,
    max: 3,
  });

  await prisma.jobSkill.createMany({
    data: [
      ...explicitSkills.map((name) => ({
        jobId: job.id,
        name,
        type: SkillType.EXPLICIT,
      })),
      ...inferredSkills.map((name) => ({
        jobId: job.id,
        name,
        type: SkillType.INFERRED,
      })),
    ],
  });

  const jobKeywords = faker.helpers.arrayElements([...keywordIds.keys()], {
    min: 2,
    max: 5,
  });

  await prisma.jobKeyword.createMany({
    data: jobKeywords.map((name) => ({
      jobId: job.id,
      keywordId: keywordIds.get(name)!,
      editedByAdmin: false,
    })),
    skipDuplicates: true,
  });

  return job;
}

export async function seedJobs(
  prisma: PrismaClient,
  companies: Company[],
  jobsPerCompany: { min: number; max: number },
) {
  console.log(`Seeding jobs for ${companies.length} companies...`);

  const keywordIds = await seedKeywords(prisma);
  let total = 0;

  for (const company of companies) {
    const count = faker.number.int(jobsPerCompany);
    for (let i = 0; i < count; i++) {
      await seedJobForCompany(prisma, company, keywordIds);
      total++;
    }
  }

  console.log(`  Seeded ${total} jobs`);
}
