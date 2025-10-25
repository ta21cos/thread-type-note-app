import { drizzle as drizzleBun } from 'drizzle-orm/bun-sqlite';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { Database as BunSQLiteDB } from 'bun:sqlite';
import * as schema from '../models/note.schema';
import { appConfig } from '../config';

// NOTE: Type for database - supports both Bun SQLite (dev) and D1 (production)
type Database = BunSQLiteDatabase<typeof schema> | DrizzleD1Database<typeof schema>;

// NOTE: Initialize SQLite for development (auto-init)
// This will be overridden by Workers in production
export let sqlite: BunSQLiteDB | null = null;
let dbInstance: Database;

try {
  // NOTE: Auto-initialize for development/testing with Bun
  sqlite = new BunSQLiteDB(appConfig.databaseUrl);
  dbInstance = drizzleBun(sqlite, { schema });
} catch {
  // NOTE: In Workers environment, this will fail - db will be set via setDb()
  dbInstance = null as unknown as Database;
}

export let db = dbInstance;

// NOTE: Set database instance (used by Workers to inject D1)
export const setDb = (database: Database) => {
  db = database;
};

// NOTE: Initialize D1 database for Cloudflare Workers (production)
export const initD1Database = (d1Binding: D1Database): DrizzleD1Database<typeof schema> => {
  const d1Db = drizzleD1(d1Binding, { schema });
  setDb(d1Db);
  return d1Db;
};

export * from '../models/note.schema';
export * from '../models/mention.schema';
export * from '../models/search.schema';
