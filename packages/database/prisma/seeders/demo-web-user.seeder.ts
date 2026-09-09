import {
  CompanyStatus,
  FreelanceApprovalStatus,
  generateUniqueSlug,
  JobApprovalStatus,
  JobSource,
  JobStatus,
  PrismaClient,
  SkillType,
} from '@careerslk/database';
import { slugify } from '@careerslk/lib/slugify';
import {
  getDistrictForCity,
  getProvinceForDistrict,
  getSectorForCategory,
} from '@careerslk/types';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { SALARY_CURRENCY } from './data.ts';

// Everything a real web user's account can hold, on one demo profile:
// own company + posted jobs, saved jobs, a freelance profile, posted gigs,
// a pending claim on someone else's company, and a couple of chat threads.
// Login is via the platform's real Google OAuth / email-OTP flow (WebUser
// has no password column) — signing in with this Gmail address links to
// this seeded row on first login.
const DEMO_EMAIL = 'aanish2710@gmail.com';

const COMPANY_JOB_TITLES = [
  { title: 'Senior Software Engineer', roleCategory: 'Software Engineering' },
  { title: 'Applied Research Scientist', roleCategory: 'AI/ML & Data Science' },
  {
    title: 'Security Systems Architect',
    roleCategory: 'DevOps & Infrastructure',
  },
  { title: 'Product Designer, Internal Tools', roleCategory: 'UI/UX Design' },
  { title: 'QA Automation Engineer', roleCategory: 'QA & Testing' },
  { title: 'IT Infrastructure Lead', roleCategory: 'IT Support & Networks' },
];

const DEMO_CITIES = [
  'Colombo',
  'Rajagiriya',
  'Nugegoda',
  'Kandy',
  'Galle',
  'Malabe',
];

const JOB_DESCRIPTION = (title: string, company: string) =>
  [
    `${company} is hiring a ${title} to join our applied engineering division in Colombo.`,
    `You'll work on production systems that need to be correct the first time, collaborating closely with research, security, and product teams.`,
    `We offer a hybrid work setup, private healthcare, and a genuinely interesting problem set — apply if you like building things that matter.`,
  ].join('\n\n');

async function seedDemoCompany(prisma: PrismaClient, webUserId: number) {
  const name = 'Wayne Enterprises Lanka (Pvt) Ltd';
  const websiteUrl = 'https://waynelanka.com';

  const slug = await generateUniqueSlug(slugify(name), (candidate) =>
    prisma.company
      .findUnique({ where: { slug: candidate } })
      .then((existing) => existing !== null),
  );

  const company = await prisma.company.upsert({
    where: { websiteUrl },
    update: { createdByWebUserId: webUserId },
    create: {
      name,
      slug,
      logoUrl: 'https://logo.clearbit.com/waynelanka.com',
      websiteUrl,
      careerUrl: `${websiteUrl}/careers`,
      description:
        "Applied sciences, defense-grade security tooling, and biomedical R&D — Wayne Enterprises' regional engineering hub, headquartered in Colombo.",
      linkedinUrl: 'https://linkedin.com/company/wayne-enterprises-lanka',
      status: CompanyStatus.ACTIVE,
      autoApproveJobs: true,
      createdByWebUserId: webUserId,
    },
  });

  await prisma.webUser.update({
    where: { id: webUserId },
    data: { companyId: company.id },
  });

  return company;
}

async function seedDemoPostedJobs(
  prisma: PrismaClient,
  webUserId: number,
  companyId: number,
  companyName: string,
) {
  const jobs = [];

  for (let i = 0; i < COMPANY_JOB_TITLES.length; i++) {
    const { title, roleCategory } = COMPANY_JOB_TITLES[i]!;
    const city = DEMO_CITIES[i % DEMO_CITIES.length]!;
    const district = getDistrictForCity(city)!;
    const province = getProvinceForDistrict(district)!;
    const fingerprint = `web:${randomUUID()}`;
    const salaryMin = faker.number.int({ min: 180_000, max: 350_000 });
    const salaryMax =
      salaryMin + faker.number.int({ min: 50_000, max: 150_000 });
    // First one left pending review so the account shows both states.
    const approvalStatus =
      i === 0 ? JobApprovalStatus.PENDING : JobApprovalStatus.APPROVED;

    const job = await prisma.job.create({
      data: {
        companyId,
        fingerprint,
        title,
        slug: `pending-${fingerprint}`,
        location: `${city}, ${district}`,
        province,
        district,
        city,
        workMode: faker.helpers.arrayElement(['hybrid', 'onsite', 'remote']),
        employmentType: faker.helpers.weightedArrayElement([
          { value: 'full_time', weight: 5 },
          { value: 'contract', weight: 1 },
        ]),
        roleCategory,
        sector: getSectorForCategory(roleCategory),
        salaryMin,
        salaryMax,
        salaryCurrency: SALARY_CURRENCY,
        salaryRaw: `${SALARY_CURRENCY} ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}`,
        description: JOB_DESCRIPTION(title, companyName),
        deadline: faker.date.soon({ days: 30 }),
        status: JobStatus.ACTIVE,
        lastSeenAt: new Date(),
        source: JobSource.POSTED,
        postedByWebUserId: webUserId,
        approvalStatus,
        ...(approvalStatus === JobApprovalStatus.APPROVED && {
          approvedAt: faker.date.recent({ days: 10 }),
        }),
      },
    });

    const finalSlug = `${slugify(title)}-${slugify(companyName)}-${job.id}`;
    await prisma.job.update({
      where: { id: job.id },
      data: { slug: finalSlug },
    });

    const skills = faker.helpers.arrayElements(
      [
        'TypeScript',
        'React',
        'Node.js',
        'PostgreSQL',
        'AWS',
        'Docker',
        'Figma',
      ],
      { min: 3, max: 5 },
    );
    await prisma.jobSkill.createMany({
      data: skills.map((name) => ({
        jobId: job.id,
        name,
        type: SkillType.EXPLICIT,
      })),
    });

    jobs.push({ ...job, slug: finalSlug });
  }

  return jobs;
}

async function seedDemoSavedJobs(
  prisma: PrismaClient,
  webUserId: number,
  excludeCompanyId: number,
) {
  const candidates = await prisma.job.findMany({
    where: {
      status: JobStatus.ACTIVE,
      approvalStatus: JobApprovalStatus.APPROVED,
      companyId: { not: excludeCompanyId },
    },
    select: { id: true },
    take: 200,
  });

  const picks = faker.helpers.arrayElements(candidates, {
    min: Math.min(8, candidates.length),
    max: Math.min(12, candidates.length),
  });

  for (const job of picks) {
    await prisma.savedJob.upsert({
      where: { webUserId_jobId: { webUserId, jobId: job.id } },
      update: {},
      create: { webUserId, jobId: job.id },
    });
  }

  return picks.length;
}

async function seedDemoFreelanceProfile(
  prisma: PrismaClient,
  webUserId: number,
  reviewingAdminId: number,
) {
  const slug = await generateUniqueSlug(slugify('Bruce Wayne'), (candidate) =>
    prisma.freelanceProfile
      .findUnique({ where: { slug: candidate } })
      .then((existing) => existing !== null),
  );

  return prisma.freelanceProfile.upsert({
    where: { webUserId },
    update: {},
    create: {
      webUserId,
      bio: [
        'Full-stack engineer and security consultant with a decade building resilient, high-availability systems for enterprise and defense-adjacent clients.',
        'I take on select freelance engagements outside my day job — architecture reviews, penetration testing, and rapid MVP builds. Discreet, deadline-driven, and thorough.',
      ].join('\n\n'),
      rate: 12_000,
      rateCurrency: SALARY_CURRENCY,
      category: 'Development & IT',
      skills: ['Web Development', 'DevOps', 'QA & Testing'],
      portfolioLinks: [
        'https://github.com/bwayne-lk',
        'https://waynelanka.com/engineering',
      ],
      workHistory: [
        {
          title: 'Head of Applied Engineering',
          organization: 'Wayne Enterprises Lanka',
          description:
            'Leading R&D and internal security tooling for the regional engineering hub.',
          startDate: '2021-03-01',
        },
        {
          title: 'Independent Security Consultant',
          organization: 'Self-employed',
          description:
            'Penetration testing and infrastructure hardening for fintech and healthcare clients.',
          startDate: '2016-01-01',
          endDate: '2021-02-28',
        },
      ],
      slug,
      approvalStatus: FreelanceApprovalStatus.APPROVED,
      approvedByAdminId: reviewingAdminId,
      approvedAt: faker.date.recent({ days: 15 }),
    },
  });
}

const GIG_SEEDS = [
  {
    title: 'Penetration test for a fintech mobile app',
    category: 'Development & IT',
    skills: ['QA & Testing', 'DevOps'],
    budgetMin: 45_000,
    budgetMax: 90_000,
  },
  {
    title: 'Build a real-time ops dashboard MVP',
    category: 'Development & IT',
    skills: ['Web Development'],
    budgetMin: 60_000,
    budgetMax: 150_000,
  },
  {
    title: 'Ongoing DevOps support (part-time, 10hrs/week)',
    category: 'Development & IT',
    skills: ['DevOps'],
    budgetMin: 30_000,
    budgetMax: null,
  },
  {
    title: 'UI/UX audit for an internal admin tool',
    category: 'Design & Creative',
    skills: ['UI/UX Design'],
    budgetMin: 20_000,
    budgetMax: 40_000,
  },
];

async function seedDemoGigs(
  prisma: PrismaClient,
  webUserId: number,
  reviewingAdminId: number,
) {
  const gigs = [];

  for (const seed of GIG_SEEDS) {
    const slug = await generateUniqueSlug(slugify(seed.title), (candidate) =>
      prisma.gig
        .findUnique({ where: { slug: candidate } })
        .then((existing) => existing !== null),
    );

    const gig = await prisma.gig.create({
      data: {
        postedByWebUserId: webUserId,
        title: seed.title,
        description: faker.lorem.paragraphs(2, '\n\n'),
        category: seed.category,
        skills: seed.skills,
        budgetMin: seed.budgetMin,
        budgetMax: seed.budgetMax,
        budgetCurrency: SALARY_CURRENCY,
        deadline: faker.date.soon({ days: 45 }),
        slug,
        approvalStatus: FreelanceApprovalStatus.APPROVED,
        approvedByAdminId: reviewingAdminId,
        approvedAt: faker.date.recent({ days: 10 }),
      },
    });

    gigs.push(gig);
  }

  return gigs;
}

async function seedDemoCompanyClaim(
  prisma: PrismaClient,
  webUserId: number,
  excludeCompanyId: number,
) {
  const target = await prisma.company.findFirst({
    where: { id: { not: excludeCompanyId }, createdByWebUserId: null },
    orderBy: { id: 'asc' },
  });
  if (!target) return null;

  return prisma.companyClaim.upsert({
    where: { webUserId_companyId: { webUserId, companyId: target.id } },
    update: {},
    create: { webUserId, companyId: target.id },
  });
}

function pair(a: number, b: number): { one: number; two: number } {
  return a < b ? { one: a, two: b } : { one: b, two: a };
}

async function seedDemoConversations(
  prisma: PrismaClient,
  webUserId: number,
  gigId: number | undefined,
) {
  const others = await prisma.webUser.findMany({
    where: { id: { not: webUserId } },
    select: { id: true },
    take: 2,
    orderBy: { id: 'asc' },
  });

  for (const other of others) {
    const { one, two } = pair(webUserId, other.id);

    const conversation = await prisma.conversation.upsert({
      where: {
        participantOneId_participantTwoId: {
          participantOneId: one,
          participantTwoId: two,
        },
      },
      update: {},
      create: {
        participantOneId: one,
        participantTwoId: two,
        contextGigId: gigId,
      },
    });

    const messageCount = faker.number.int({ min: 2, max: 5 });
    const senders = [webUserId, other.id];
    let cursor = faker.date.recent({ days: 5 });
    let lastMessage = null;

    for (let m = 0; m < messageCount; m++) {
      cursor = faker.date.soon({ days: 1, refDate: cursor });
      lastMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: senders[m % 2]!,
          body: faker.lorem.sentence(),
          createdAt: cursor,
        },
      });
    }

    if (lastMessage) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: lastMessage.createdAt },
      });
    }
  }
}

export async function seedDemoWebUser(
  prisma: PrismaClient,
  reviewingAdminId: number,
) {
  console.log(`Seeding demo web user (${DEMO_EMAIL})...`);

  const webUser = await prisma.webUser.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      firstName: 'Bruce',
      lastName: 'Wayne',
      isActive: true,
    },
    create: {
      email: DEMO_EMAIL,
      firstName: 'Bruce',
      lastName: 'Wayne',
      avatarUrl: `https://i.pravatar.cc/300?u=${encodeURIComponent(DEMO_EMAIL)}`,
      isActive: true,
      lastLoginAt: faker.date.recent({ days: 2 }),
    },
  });

  const company = await seedDemoCompany(prisma, webUser.id);
  const postedJobs = await seedDemoPostedJobs(
    prisma,
    webUser.id,
    company.id,
    company.name,
  );
  const savedCount = await seedDemoSavedJobs(prisma, webUser.id, company.id);
  await seedDemoFreelanceProfile(prisma, webUser.id, reviewingAdminId);
  const gigs = await seedDemoGigs(prisma, webUser.id, reviewingAdminId);
  await seedDemoCompanyClaim(prisma, webUser.id, company.id);
  await seedDemoConversations(prisma, webUser.id, gigs[0]?.id);

  console.log(
    `  Demo web user ready: ${webUser.email} — company "${company.name}", ${postedJobs.length} posted jobs, ${savedCount} saved jobs, 1 freelance profile, ${gigs.length} gigs.`,
  );

  return webUser;
}
