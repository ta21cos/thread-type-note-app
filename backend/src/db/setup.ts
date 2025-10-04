import { Database } from 'bun:sqlite';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// NOTE: Database initialization script
const dbPath = process.env.DATABASE_URL || 'data/notes.db';

async function setup() {
  // Create data directory if it doesn't exist
  await mkdir(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 1000),
      parent_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      depth INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mentions (
      id TEXT PRIMARY KEY,
      from_note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      to_note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(from_note_id, to_note_id, position)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS search_index (
      note_id TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      tokens TEXT NOT NULL,
      mentions TEXT,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  // Create indexes for performance
  db.run('CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_mentions_from ON mentions(from_note_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_mentions_to ON mentions(to_note_id)');

  // Create FTS5 virtual table for full-text search
  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      note_id UNINDEXED,
      content,
      tokenize='porter unicode61'
    )
  `);

  // Triggers to keep FTS in sync
  db.run(`
    CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(note_id, content) VALUES (new.id, new.content);
    END
  `);

  db.run(`
    CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
      UPDATE notes_fts SET content = new.content WHERE note_id = new.id;
    END
  `);

  db.run(`
    CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
      DELETE FROM notes_fts WHERE note_id = old.id;
    END
  `);

  db.close();
  console.log('✓ Database setup complete');
}

setup().catch(console.error);
