import { Database } from 'bun:sqlite';

// NOTE: Script to clean test database for E2E tests using direct SQL
const DATABASE_URL = process.env.DATABASE_URL || 'backend/data/test.db';

function cleanDatabase() {
  console.log('Cleaning test database...');

  const sqlite = new Database(DATABASE_URL);

  try {
    // NOTE: Delete in proper order using raw SQL - child tables first
    // Wrap each in try-catch to handle tables that might not exist yet
    try {
      sqlite.run('DELETE FROM search_index');
    } catch (e) {
      // Ignore if table doesn't exist
    }

    try {
      sqlite.run('DELETE FROM mentions');
    } catch (e) {
      // Ignore if table doesn't exist
    }

    try {
      sqlite.run('DELETE FROM notes');
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // NOTE: Clean FTS5 virtual table if it exists
    try {
      sqlite.run('DELETE FROM notes_fts');
    } catch (e) {
      // Ignore if FTS table doesn't exist
    }

    console.log('✓ Test database cleaned');
    sqlite.close();
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    sqlite.close();
    process.exit(1);
  }
}

cleanDatabase();
