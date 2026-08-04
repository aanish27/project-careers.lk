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

  // SEO engine schedules (defaults in code — expiry/generation run daily,
  // offset after the scraper; lifecycle evaluation runs weekly)
  SEO_EXPIRY_CRON: Joi.string().optional(),
  SEO_GENERATION_CRON: Joi.string().optional(),
  SEO_LIFECYCLE_CRON: Joi.string().optional(),
  SEO_TZ: Joi.string().optional(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),

  // JWT — web-user (job-seeker web accounts). Deliberately separate secrets
  // from the admin JWT above: both AdminUser.id and WebUser.id are
  // autoincrement starting at 1, so sharing a secret/strategy would let a
  // web-user token be validated as an unrelated admin with the same numeric id.
  JWT_WEB_USER_SECRET: Joi.string().min(32).required(),
  JWT_WEB_USER_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
  JWT_WEB_USER_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_WEB_USER_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),

  // Shared secret the Next.js web server must present to call web-user-auth
  // endpoints that trust a caller-supplied Google profile (see InternalOnlyGuard).
  INTERNAL_API_KEY: Joi.string().min(32).required(),

  // Keys the web-user email-OTP hash (HMAC-SHA256, not a slow hash — see
  // WebUserEmailOtpService for why). Separate from INTERNAL_API_KEY/JWT
  // secrets, same "never reuse a secret across purposes" pattern.
  OTP_HASH_SECRET: Joi.string().min(32).required(),

  // SMTP (email-OTP delivery) — optional like the AI keys below: unset means
  // "not configured yet," not a startup failure, since a real provider isn't
  // chosen until later. MailService throws a clear error if a send is
  // attempted without these set, rather than crashing the whole API at boot.
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM_EMAIL: Joi.string().optional(),
  SMTP_FROM_NAME: Joi.string().default('careers.lk'),

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

  // AI cost/usage widgets — all optional, unset means "not configured" (no
  // startup failure). Admin key is distinct from the scraper's regular key.
  CLAUDE_ADMIN_API_KEY: Joi.string().optional(),
  CLAUDE_BASE_URL: Joi.string().default('https://api.anthropic.com'),
  DEEPSEEK_API_KEY: Joi.string().optional(),
  DEEPSEEK_BASE_URL: Joi.string().default('https://api.deepseek.com'),
});
