import { PrismaClient } from '@careerslk/database';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool } from 'pg';
import { seedDemoWebUser } from './seeders/demo-web-user.seeder.ts';

async function main() {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const reviewingAdmin = await prisma.adminUser.findFirstOrThrow({
    orderBy: { id: 'asc' },
  });

  await seedDemoWebUser(prisma, reviewingAdmin.id);

  console.log('Demo web user seeding complete.');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
