import { PrismaClient } from '@careerslk/database';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool } from 'pg';
import { seedAbuseReports } from './seeders/abuse-reports.seeder.ts';
import { seedAdvertisers } from './seeders/advertisers.seeder.ts';
import { seedConversations } from './seeders/chat.seeder.ts';
import { seedCompanies } from './seeders/companies.seeder.ts';
import { seedFreelanceProfiles } from './seeders/freelance-profiles.seeder.ts';
import { seedGigs } from './seeders/gigs.seeder.ts';
import { seedJobs } from './seeders/jobs.seeder.ts';
import { seedScrapeLogs } from './seeders/scrape-logs.seeder.ts';
import { seedSeoLookups } from './seeders/seo.seeder.ts';
import { seedPermissions } from './seeders/permissions.seeder.ts';
import { seedSuperAdmin } from './seeders/rbac.seeder.ts';
import { seedAdminUsers } from './seeders/admin-users.seeder.ts';
import { seedWebUserBlocks } from './seeders/web-user-blocks.seeder.ts';
import { seedWebUsers } from './seeders/web-users.seeder.ts';

function envInt(name: string, fallback: number): number {
  const value = process.env[name];
  return value ? parseInt(value, 10) : fallback;
}

async function main() {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const companyCount = envInt('SEED_COMPANY_COUNT', 20);
  const jobsPerCompany = {
    min: envInt('SEED_JOBS_PER_COMPANY_MIN', 5),
    max: envInt('SEED_JOBS_PER_COMPANY_MAX', 20),
  };
  const advertiserCount = envInt('SEED_ADVERTISER_COUNT', 6);
  const webUserCount = envInt('SEED_WEB_USER_COUNT', 30);
  const freelanceProfileCount = envInt('SEED_FREELANCE_PROFILE_COUNT', 15);
  const gigCount = envInt('SEED_GIG_COUNT', 20);
  const conversationCount = envInt('SEED_CONVERSATION_COUNT', 12);
  const blockCount = envInt('SEED_BLOCK_COUNT', 3);
  const abuseReportCount = envInt('SEED_ABUSE_REPORT_COUNT', 10);

  await seedPermissions(prisma);
  await seedSuperAdmin(prisma, {
    email: process.env['SUPER_ADMIN_EMAIL'],
    password: process.env['SUPER_ADMIN_PASSWORD'],
  });
  await seedAdminUsers(prisma);

  const reviewingAdmin = await prisma.adminUser.findFirstOrThrow({
    orderBy: { id: 'asc' },
  });

  await seedSeoLookups(prisma);

  const companies = await seedCompanies(prisma, companyCount);
  await seedJobs(prisma, companies, jobsPerCompany);
  await seedScrapeLogs(prisma, companies);
  await seedAdvertisers(prisma, advertiserCount);

  const webUsers = await seedWebUsers(prisma, webUserCount);
  const freelanceProfiles = await seedFreelanceProfiles(
    prisma,
    webUsers,
    freelanceProfileCount,
    reviewingAdmin.id,
  );
  const gigs = await seedGigs(prisma, webUsers, gigCount, reviewingAdmin.id);
  const { conversations, messages } = await seedConversations(
    prisma,
    webUsers,
    gigs,
    freelanceProfiles,
    conversationCount,
  );
  await seedWebUserBlocks(prisma, conversations, blockCount);
  await seedAbuseReports(
    prisma,
    webUsers,
    freelanceProfiles,
    gigs,
    conversations,
    messages,
    abuseReportCount,
    reviewingAdmin.id,
  );

  console.log('Seeding complete.');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
