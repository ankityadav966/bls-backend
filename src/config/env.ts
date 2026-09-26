import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z.string().default('mongodb+srv://akraoshab0009_db_user:ZzWRJCEJkfojlSt8@cluster0.wu3i78y.mongodb.net/BLS?retryWrites=true&w=majority&appName=Cluster0'),
  REDIS_URL: z.string().default(''),
  REDIS_ENABLED: z.string().default('false').transform((val) => val === 'true'),
  JWT_ACCESS_SECRET: z.string().default('bls_company_enterprise_jwt_access_secret_key_2026_secure'),
  JWT_REFRESH_SECRET: z.string().default('bls_company_enterprise_jwt_refresh_secret_key_2026_secure'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_PUBLIC_URL: z.string().default('https://pls.durgaselector.com'),
  FRONTEND_PARTNER_URL: z.string().default('https://partner.pls.durgaselector.com'),
  FRONTEND_ADMIN_URL: z.string().default('https://admin.pls.durgaselector.com'),
  CORS_ORIGINS: z.string().default('https://pls.durgaselector.com,http://bls.durgagenerator.com,https://bls.durgagenerator.com'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().default('15').transform((val) => parseInt(val, 10)),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default('dswm5fwef'),
  CLOUDINARY_API_KEY: z.string().optional().default('388112731967314'),
  CLOUDINARY_API_SECRET: z.string().optional().default('TFkIJh_sZ1AbcROEt8vfEJbe0RA'),
  CLOUDINARY_FOLDER: z.string().optional().default('BLS'),
});

export const env = envSchema.parse(process.env);
