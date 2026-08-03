export default () => ({
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'API',
  url: process.env.APP_URL || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  jwtWebUser: {
    secret: process.env.JWT_WEB_USER_SECRET,
    expiresIn: process.env.JWT_WEB_USER_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_WEB_USER_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_WEB_USER_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  internal: {
    apiKey: process.env.INTERNAL_API_KEY,
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    maxFileSize:
      parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    s3: {
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_S3_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_S3_KEY,
      bucket: process.env.AWS_S3_BUCKET,
    },
    local: {
      path: process.env.LOCAL_STORAGE_PATH || './uploads',
    },
  },
});
