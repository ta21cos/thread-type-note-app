import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from '../models/note.schema';

// NOTE: SQLite connection with Drizzle ORM
export const sqlite = new Database(process.env.DATABASE_URL || 'data/notes.db');
export const db = drizzle(sqlite, { schema });

export * from '../models/note.schema';
export * from '../models/mention.schema';
export * from '../models/search.schema';
