import { db } from '../db';
import { notes } from '../models/note.schema';
import { like, desc, asc, eq, and, or, sql, count } from 'drizzle-orm';
import type { Note } from '../db';

// NOTE: Repository for content search using advanced Drizzle ORM features
export class SearchRepository {
  // NOTE: Prepared statement for better performance
  private searchByContentPrepared = db
    .select()
    .from(notes)
    .where(like(notes.content, sql.placeholder('pattern')))
    .orderBy(desc(notes.updatedAt))
    .limit(sql.placeholder('limit'))
    .prepare();

  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    // NOTE: Use prepared statement for better performance
    const likePattern = `%${query}%`;

    return await this.searchByContentPrepared.execute({
      pattern: likePattern,
      limit,
    });
  }
}
