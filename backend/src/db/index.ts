import type { Database } from './types';

// NOTE: Database instance - set by environment-specific initialization
export let db: Database = null as unknown as Database;

// NOTE: Set database instance (used by both Bun and Workers environments)
export const setDb = (database: Database) => {
  db = database;
};

export * from '../models/note.schema';
export * from '../models/mention.schema';
export * from '../models/search.schema';
export type { Database } from './types';
