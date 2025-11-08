import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { setDb } from '../src/db';
import * as schema from '../src/db';

// NOTE: Preload script for Bun test runner to initialize database
const DATABASE_URL = process.env.DATABASE_URL || 'data/test.db';
const sqlite = new Database(DATABASE_URL);
const database = drizzle(sqlite, { schema });
setDb(database);

console.log('✓ Test database initialized:', DATABASE_URL);
