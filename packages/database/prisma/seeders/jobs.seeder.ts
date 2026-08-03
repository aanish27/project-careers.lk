import { JobStatus, PrismaClient, SkillType } from '@careerslk/database';
import type { Company } from '@careerslk/database';
import {
  normalizeLocationName,
  normalizeSkillName,
} from '@careerslk/lib/normalizers';
import { slugify } from '@careerslk/lib/slugify';
import { ALL_CATEGORIES, getSectorForCategory } from '@careerslk/types';
import { faker } from '@faker-js/faker';
import { createHash } from 'node:crypto';
import {
  DEPARTMENTS,
  EXPLICIT_SKILLS,
  KEYWORD_POOL,
  SALARY_CURRENCY,
  SRI_LANKAN_CITIES,
} from './data.ts';

interface SeoLookupMaps {
  roleIdBySlug: Map<string, number>;
  locationIdBySlug: Map<string, number>;
  skillIdBySlug: Map<string, number>;
}

async function loadSeoLookupMaps(prisma: PrismaClient): Promise<SeoLookupMaps> {
  const [roles, locations, skills] = await Promise.all([
    prisma.seoRole.findMany({ select: { id: true, slug: true } }),
    prisma.seoLocation.findMany({ select: { id: true, slug: true } }),
    prisma.seoSkill.findMany({ select: { id: true, slug: true } }),
  ]);

  return {
    roleIdBySlug: new Map(roles.map((r) => [r.slug, r.id])),
    locationIdBySlug: new Map(locations.map((l) => [l.slug, l.id])),
    skillIdBySlug: new Map(skills.map((s) => [s.slug, s.id])),
  };
}

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
  seoLookups: SeoLookupMaps,
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
  const roleCategory = faker.helpers.arrayElement(ALL_CATEGORIES);
  const location = faker.datatype.boolean({ probability: 0.85 })
    ? `${faker.helpers.arrayElement(SRI_LANKAN_CITIES)}, Sri Lanka`
    : null;

  const normalizedLocation = normalizeLocationName(location);
  const seoRoleId = seoLookups.roleIdBySlug.get(slugify(roleCategory));
  const seoLocationId = normalizedLocation
    ? seoLookups.locationIdBySlug.get(slugify(normalizedLocation))
    : undefined;

  const jobFingerprint = fingerprint(company.id, title, applyUrl);

  const job = await prisma.job.upsert({
    where: { fingerprint: jobFingerprint },
    update: {},
    create: {
      companyId: company.id,
      fingerprint: jobFingerprint,
      title,
      // Real slug depends on the autoincrement id, patched in below.
      slug: `pending-${jobFingerprint}`,
      location,
      workMode: faker.helpers.arrayElement(WORK_MODES),
      employmentType: faker.helpers.arrayElement(EMPLOYMENT_TYPES),
      roleCategory,
      sector: getSectorForCategory(roleCategory),
      seoRoleId,
      seoLocationId,
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

  if (job.slug.startsWith('pending-')) {
    const finalSlug = `${slugify(title)}-${slugify(company.name)}-${job.id}`;
    await prisma.job.update({
      where: { id: job.id },
      data: { slug: finalSlug },
    });
    job.slug = finalSlug;
  }

  await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });

  const explicitSkills = faker.helpers.arrayElements(EXPLICIT_SKILLS, {
    min: 2,
    max: 6,
  });
  const inferredSkills = faker.helpers.arrayElements(EXPLICIT_SKILLS, {
    min: 0,
    max: 3,
  });

  const buildSkillRow = (name: string, type: SkillType) => {
    const normalized = normalizeSkillName(name);
    return {
      jobId: job.id,
      name,
      type,
      seoSkillId: normalized
        ? seoLookups.skillIdBySlug.get(slugify(normalized))
        : undefined,
    };
  };

  await prisma.jobSkill.createMany({
    data: [
      ...explicitSkills.map((name) => buildSkillRow(name, SkillType.EXPLICIT)),
      ...inferredSkills.map((name) => buildSkillRow(name, SkillType.INFERRED)),
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
  const seoLookups = await loadSeoLookupMaps(prisma);
  let total = 0;

  for (const company of companies) {
    const count = faker.number.int(jobsPerCompany);
    for (let i = 0; i < count; i++) {
      await seedJobForCompany(prisma, company, keywordIds, seoLookups);
      total++;
    }
  }

  console.log(`  Seeded ${total} jobs`);
}
