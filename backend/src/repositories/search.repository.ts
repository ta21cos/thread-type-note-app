import { sqlite } from '../db';
import type { Note } from '../db';

// NOTE: Repository for FTS5 full-text search
export class SearchRepository {
  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    // NOTE: Use LIKE for substring matching (case-insensitive)
    // FTS5 MATCH only supports prefix matching, not substring
    const likePattern = `%${query}%`;

    const searchQuery = sqlite.query<Note, [string, number]>(`
      SELECT * FROM notes
      WHERE LOWER(content) LIKE LOWER(?)
      LIMIT ?
    `);

    const notes = searchQuery.all(likePattern, limit);

    // NOTE: Convert Date objects to ISO strings for serialization
    return notes.map((note) => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
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
