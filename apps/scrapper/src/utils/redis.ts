import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) throw new Error('REDIS_URL is not set');

// Shared Redis connection for all BullMQ workers in this process.
// maxRetriesPerRequest must be null for BullMQ blocking commands.
export const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});
