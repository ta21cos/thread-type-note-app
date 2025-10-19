import { config } from 'dotenv';
import { resolve, dirname } from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';

const envFile = ((nodeEnv: string) => {
  switch (nodeEnv) {
    case 'test':
      return '.env.test';
    case 'production':
      return '.env.production';
    default:
      return '.env';
  }
})(nodeEnv);

const __dirname = dirname(__filename);
const backendRoot = resolve(__dirname, '../../');
const envPath = resolve(backendRoot, envFile);

config({ path: envPath });

export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
}

if (!process.env.DATABASE_URL || !process.env.PORT) {
  throw new Error('DATABASE_URL or PORT is not set in the environment variables');
}

export const appConfig: Config = {
  nodeEnv,
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
};
