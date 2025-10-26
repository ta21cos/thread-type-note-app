import type { Config } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL;

export default {
  schema: './src/models/*.schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // For local development with SQLite
  ...(DATABASE_URL && {
    dbCredentials: {
      url: DATABASE_URL,
    },
  }),
  // For Cloudflare D1, wrangler.toml configuration is used automatically
} satisfies Config;
