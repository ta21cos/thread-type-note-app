import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from '../models/note.schema';
import { appConfig } from '../config';

// NOTE: SQLite connection with Drizzle ORM
export const sqlite = new Database(appConfig.databaseUrl);
export const db = drizzle(sqlite, { schema });

export * from '../models/note.schema';
export * from '../models/mention.schema';
export * from '../models/search.schema';
