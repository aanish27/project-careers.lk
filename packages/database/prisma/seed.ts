import { PrismaClient } from '@careerslk/database';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool } from 'pg';
import { seedAdvertisers } from './seeders/advertisers.seeder.ts';
import { seedCompanies } from './seeders/companies.seeder.ts';
import { seedJobs } from './seeders/jobs.seeder.ts';
import { seedScrapeLogs } from './seeders/scrape-logs.seeder.ts';
import { seedSeoLookups } from './seeders/seo.seeder.ts';
import { seedPermissions } from './seeders/permissions.seeder.ts';
import { seedSuperAdmin } from './seeders/rbac.seeder.ts';
import { seedAdminUsers } from './seeders/admin-users.seeder.ts';

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

  await seedPermissions(prisma);
  await seedSuperAdmin(prisma, {
    email: process.env['SUPER_ADMIN_EMAIL'],
    password: process.env['SUPER_ADMIN_PASSWORD'],
  });
  await seedAdminUsers(prisma);

  await seedSeoLookups(prisma);

  const companies = await seedCompanies(prisma, companyCount);
  await seedJobs(prisma, companies, jobsPerCompany);
  await seedScrapeLogs(prisma, companies);
  await seedAdvertisers(prisma, advertiserCount);

  console.log('Seeding complete.');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
