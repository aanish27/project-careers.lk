import { PrismaClient } from '@careerslk/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { ScrapeService } from './services/scrape.service';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma: PrismaClient = new PrismaClient({ adapter });

console.log('🚀 Scraper worker ready');
ScrapeService.scrape();
