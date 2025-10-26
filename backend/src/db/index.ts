import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../models/note.schema';

// NOTE: Type for database - supports both Bun SQLite (dev) and D1 (production)
// Using 'any' for Bun type to avoid importing 'drizzle-orm/bun-sqlite' which would fail in Workers build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any | DrizzleD1Database<typeof schema>;

// NOTE: Database instance - set by environment-specific initialization
export let db: Database = null as unknown as Database;

// NOTE: Set database instance (used by both Bun and Workers environments)
export const setDb = (database: Database) => {
  db = database;
};

export * from '../models/note.schema';
export * from '../models/mention.schema';
export * from '../models/search.schema';
