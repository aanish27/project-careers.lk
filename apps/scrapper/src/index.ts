import { prisma } from '@careerslk/database';
import { Worker } from 'bullmq';
import { processScrapeJob } from './processors/scrape-processor';

const scraperWorker = new Worker(
  'scrape-queue',
  async (job) => {
    return await processScrapeJob(job, prisma);
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
    concurrency: 3,
  },
);

scraperWorker.on('completed', (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

scraperWorker.on('failed', (job, err) => {
  console.error(`✗ Job ${job.id} failed:`, err.message);
});

console.log('🚀 Scraper worker ready');
