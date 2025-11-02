import { db } from '../db';
import { notes } from '../models/note.schema';
import { like, desc } from 'drizzle-orm';
import type { Note } from '../db';

// NOTE: Repository for content search using advanced Drizzle ORM features
export class SearchRepository {
  // NOTE: Prepared statement for better performance

  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    // NOTE: Use prepared statement for better performance
    const likePattern = `%${query}%`;

    const result = await db
      .select()
      .from(notes)
      .where(like(notes.content, likePattern))
      .orderBy(desc(notes.updatedAt))
      .limit(limit);

    return result;
  }
}
