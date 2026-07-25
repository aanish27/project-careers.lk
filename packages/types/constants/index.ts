export const SCRAPER_COMPANY_QUEUE = 'scrapper-company-queue';
export const SCRAPER_JOB_QUEUE = 'scrapper-job-queue';
export const SCRAPER_BATCH_POLL_QUEUE = 'scrapper-batch-poll-queue';

export const SCRAPE_BACKOFF_MS = [30_000, 120_000, 600_000]; // 30s, 2min, 10min

export const BATCH_POLL_DELAY_MS = 1_800_000; // 30 min between each status check
export const BATCH_POLL_MAX_ATTEMPTS = 30; // up to 15 hours of polling
