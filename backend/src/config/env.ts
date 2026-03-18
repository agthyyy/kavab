import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3000'), 10),

  db: {
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    name: optional('DB_NAME', 'kavabanga'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', ''),
  },

  testDb: {
    host: optional('TEST_DB_HOST', 'localhost'),
    port: parseInt(optional('TEST_DB_PORT', '5432'), 10),
    name: optional('TEST_DB_NAME', 'kavabanga_test'),
    user: optional('TEST_DB_USER', 'postgres'),
    password: optional('TEST_DB_PASSWORD', ''),
  },

  jwt: {
    accessSecret: optional('JWT_ACCESS_SECRET', 'dev_access_secret_change_in_production'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_in_production'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  firebase: {
    serviceAccountPath: process.env['FIREBASE_SERVICE_ACCOUNT_PATH'],
    serviceAccountBase64: process.env['FIREBASE_SERVICE_ACCOUNT_BASE64'],
    storageBucket: optional('FIREBASE_STORAGE_BUCKET', ''),
  },
} as const;
