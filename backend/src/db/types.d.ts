import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { SQL } from 'drizzle-orm';
import type * as schema from '../models/note.schema';

// NOTE: Bun SQLite database type for local development
export type BunDatabase = BunSQLiteDatabase<typeof schema>;

// NOTE: D1 database type for Cloudflare Workers
export type D1DrizzleDatabase = DrizzleD1Database<typeof schema>;

// NOTE: Execute method return type for raw SQL queries
export interface ExecuteResult {
  rows: unknown[];
}

// NOTE: Common database interface with execute method for raw SQL
// TODO: REMOVE
export interface DatabaseWithExecute {
  execute: (query: SQL) => Promise<ExecuteResult>;
}

// NOTE: Union type supporting both Bun SQLite (dev) and D1 (production)
export type Database = (BunDatabase | D1DrizzleDatabase) & DatabaseWithExecute;
