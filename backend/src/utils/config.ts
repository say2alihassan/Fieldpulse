import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  // Server
  port: parseInt(optionalEnv('PORT', '3000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDev: optionalEnv('NODE_ENV', 'development') === 'development',

  // Database
  databaseUrl: requireEnv('DATABASE_URL'),

  // JWT
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    accessExpiry: optionalEnv('JWT_ACCESS_EXPIRY', '15m'),
    refreshExpiry: optionalEnv('JWT_REFRESH_EXPIRY', '7d'),
  },

  // S3/MinIO
  s3: {
    endpoint: optionalEnv('S3_ENDPOINT', 'http://localhost:9000'),
    accessKey: optionalEnv('S3_ACCESS_KEY', 'minioadmin'),
    secretKey: optionalEnv('S3_SECRET_KEY', 'minioadmin'),
    bucket: optionalEnv('S3_BUCKET', 'fieldpulse'),
    region: optionalEnv('S3_REGION', 'us-east-1'),
  },

  // Redis
  redisUrl: optionalEnv('REDIS_URL', 'redis://localhost:6379'),

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Push notifications
  push: {
    enabled: optionalEnv('PUSH_ENABLED', 'false') === 'true',
  },

  // Firebase
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || undefined,
  },
} as const;

export type Config = typeof config;
