import { SearchRepository } from '../repositories/search.repository';
import { MentionRepository } from '../repositories/mention.repository';
import type { Note } from '../db';

// NOTE: Service for content search
export class SearchService {
  private searchRepo = new SearchRepository();
  private mentionRepo = new MentionRepository();

  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    return this.searchRepo.searchByContent(query, limit);
  }

  async searchByMention(noteId: string): Promise<Note[]> {
    const mentionsWithNotes = await this.mentionRepo.getMentionsWithNotes(noteId);
    return mentionsWithNotes.map((m) => m.note);
  }
}

export const searchService = new SearchService();
