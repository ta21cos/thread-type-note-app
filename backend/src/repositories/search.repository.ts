import { db } from '../db';
import type { Note } from '../db';

// NOTE: Repository for FTS5 full-text search
export class SearchRepository {
  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    // NOTE: FTS5 search using notes_fts virtual table
    const results = await db.execute<{ note_id: string }>(
      `
      SELECT note_id FROM notes_fts
      WHERE content MATCH ?
      LIMIT ?
      `,
      [query, limit]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

    const noteIds = results.map((r) => r.note_id);

    // Fetch full notes
    return db.execute<Note>(
      `
      SELECT * FROM notes
      WHERE id IN (${noteIds.map(() => '?').join(',')})
      `,
      noteIds
    ) as unknown as Promise<Note[]>;
  }

  async indexNote(noteId: string, content: string): Promise<void> {
    // NOTE: Triggers handle this automatically, but explicit method for manual indexing
    await db.execute(
      `
      INSERT OR REPLACE INTO notes_fts(note_id, content)
      VALUES (?, ?)
      `,
      [noteId, content.toLowerCase()]
    );
  }
}
