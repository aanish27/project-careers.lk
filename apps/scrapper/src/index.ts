import { PrismaClient } from '@careerslk/database';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma: PrismaClient = new PrismaClient({ adapter });

console.log('🚀 Scraper worker ready');
// ScrapeService.scrape();

// ClaudeService.processBatch(
//   'msgbatch_016pj6Unkt8kpUSo7w3wjWjU',
//   ClaudeBatchStatus.IN_PROGRESS,
// );
