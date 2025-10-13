import { sqlite } from '../db';
import type { Note } from '../db';

// NOTE: Repository for FTS5 full-text search
export class SearchRepository {
  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    // NOTE: FTS5 search using notes_fts virtual table
    const searchQuery = sqlite.query<{ note_id: string }, [string, number]>(`
      SELECT note_id FROM notes_fts
      WHERE content MATCH ?
      LIMIT ?
    `);

    const results = searchQuery.all(query, limit);

    if (!results || results.length === 0) {
      return [];
    }

    const noteIds = results.map((r) => r.note_id);

    // Fetch full notes
    const notesQuery = sqlite.query<Note, string[]>(`
      SELECT * FROM notes
      WHERE id IN (${noteIds.map(() => '?').join(',')})
    `);

    const notes = notesQuery.all(...noteIds);

    // NOTE: Convert Date objects to ISO strings for serialization
    return notes.map(note => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt
    }));
  }

  async indexNote(noteId: string, content: string): Promise<void> {
    // NOTE: Triggers handle this automatically, but explicit method for manual indexing
    const indexQuery = sqlite.query(`
      INSERT OR REPLACE INTO notes_fts(note_id, content)
      VALUES (?, ?)
    `);

    indexQuery.run(noteId, content.toLowerCase());
  }
}
