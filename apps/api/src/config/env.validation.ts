import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  PORT: Joi.number().default(8000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('API'),
  APP_URL: Joi.string().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().required(),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis / Queue
  REDIS_URL: Joi.string().required(),

  // Scraper schedule (fall back to '0 2 * * *' / 'Asia/Colombo' in code)
  SCRAPE_CRON: Joi.string().optional(),
  SCRAPE_TZ: Joi.string().optional(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),

  // Only read by the seed script (packages/database/prisma/seed.ts), not the app itself.
  SUPER_ADMIN_EMAIL: Joi.string().optional(),
  SUPER_ADMIN_PASSWORD: Joi.string().optional(),

  // Storage
  STORAGE_PROVIDER: Joi.string().valid('s3', 'local').default('local'),
  MAX_FILE_SIZE_MB: Joi.number().default(10),
  LOCAL_STORAGE_PATH: Joi.string().default('./uploads'),

  // AWS S3 (required only when STORAGE_PROVIDER=s3)
  AWS_REGION: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
  }),
  AWS_S3_KEY_ID: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
  }),
  AWS_SECRET_S3_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
  }),
  AWS_S3_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
  }),
});
