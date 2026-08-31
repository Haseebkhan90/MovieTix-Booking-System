import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'movietix-dev-secret-change-me',
  databaseUrl: process.env.DATABASE_URL ?? 'file:./data/movietix.db',
  appUrl: process.env.APP_URL ?? 'http://127.0.0.1:5173',
  holdMinutes: Number(process.env.HOLD_MINUTES ?? 8),
};

export const ROOT = root;
