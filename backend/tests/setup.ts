import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { setDb } from '../src/db';
import * as schema from '../src/db';

// NOTE: Global test setup to initialize database connection
export default async function setup() {
  const DATABASE_URL = process.env.DATABASE_URL || 'data/test.db';
  const sqlite = new Database(DATABASE_URL);
  const database = drizzle(sqlite, { schema });
  setDb(database);
}
