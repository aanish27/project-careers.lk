import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

export * from './generated/prisma/commonInputTypes.js';
export * from './generated/prisma/enums.js';
export * from './generated/prisma/models.js';
