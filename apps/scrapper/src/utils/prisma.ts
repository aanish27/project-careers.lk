import { PrismaClient } from '@careerslk/database';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma: PrismaClient = new PrismaClient({ adapter });
