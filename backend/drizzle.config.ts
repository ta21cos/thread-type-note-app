import type { Config } from 'drizzle-kit';

const env = process.env.NODE_ENV;

const DATABASE_URL = process.env.DATABASE_URL;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const CLOUDFLARE_D1_TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

let envConfig;

// NOTE: For Cloudflare D1, DATABASE_URL is not required during build
// D1 binding will be provided at runtime by Workers
if (env === 'production') {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_DATABASE_ID || !CLOUDFLARE_D1_TOKEN) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_D1_TOKEN are required in production'
    );
  }
  envConfig = {
    driver: 'd1-http',
    dbCredentials: {
      accountId: CLOUDFLARE_ACCOUNT_ID!,
      databaseId: CLOUDFLARE_DATABASE_ID!,
      token: CLOUDFLARE_D1_TOKEN!,
    },
  };
} else {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment variables');
  }
  envConfig = {
    dbCredentials: {
      url: DATABASE_URL,
    },
  };
}

console.log({ env: process.env, envConfig });

export default {
  schema: './src/models/*.schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  ...envConfig,
} satisfies Config;
