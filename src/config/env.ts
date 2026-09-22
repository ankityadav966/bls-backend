import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/bls_and_company'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  REDIS_ENABLED: z.string().default('true').transform((val) => val === 'true'),
  JWT_ACCESS_SECRET: z.string().default('bls_company_enterprise_jwt_access_secret_key_2026_secure'),
  JWT_REFRESH_SECRET: z.string().default('bls_company_enterprise_jwt_refresh_secret_key_2026_secure'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_PUBLIC_URL: z.string().default('http://localhost:5173'),
  FRONTEND_PARTNER_URL: z.string().default('http://localhost:5175'),
  FRONTEND_ADMIN_URL: z.string().default('http://localhost:5176'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().default('15').transform((val) => parseInt(val, 10)),
});

export const env = envSchema.parse(process.env);
