import { NoteRepository } from '../repositories/note.repository';
import { MentionRepository } from '../repositories/mention.repository';
import { generateId } from '../utils/id-generator';
import { extractMentions, getMentionPositions } from '../utils/mention-parser';
import { MAX_NOTE_LENGTH } from '@thread-note/shared/constants';
import type { Note } from '../db';

// NOTE: Service layer for Note business logic with 1000 char validation
export class NoteService {
  private noteRepo = new NoteRepository();
  private mentionRepo = new MentionRepository();

  async createNote(data: {
    content: string;
    parentId?: string;
    mentions?: string[];
  }): Promise<Note> {
    // Validate length (from clarifications: 1000 char limit)
    if (data.content.length < 1 || data.content.length > MAX_NOTE_LENGTH) {
      throw new Error(
        `Note content must be between 1 and ${MAX_NOTE_LENGTH} characters`
      );
    }

    // Calculate depth
    let depth = 0;
    if (data.parentId) {
      const parent = await this.noteRepo.findById(data.parentId);
      if (!parent) {
        throw new Error('Parent note not found');
      }
      depth = parent.depth + 1;
    }

    // Create note
    const note = await this.noteRepo.create({
      id: generateId(),
      content: data.content,
      parentId: data.parentId,
      depth,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Extract and save mentions
    const mentionIds = extractMentions(data.content);
    for (const mentionId of mentionIds) {
      const positions = getMentionPositions(data.content, mentionId);
      for (const position of positions) {
        await this.mentionRepo.create({
          id: generateId(),
          fromNoteId: note.id,
          toNoteId: mentionId,
          position,
          createdAt: new Date(),
        });
      }
    }

    return note;
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    return this.noteRepo.findById(id);
  }

  async getRootNotes(limit: number = 20, offset: number = 0) {
    const notes = await this.noteRepo.findRootNotes(limit, offset);
    const total = await this.noteRepo.countRootNotes();
    const hasMore = offset + notes.length < total;

    return { notes, total, hasMore };
  }

  async updateNote(id: string, data: { content: string }): Promise<Note> {
    // Validate length
    if (data.content.length < 1 || data.content.length > MAX_NOTE_LENGTH) {
      throw new Error(
        `Note content must be between 1 and ${MAX_NOTE_LENGTH} characters`
      );
    }

    const existing = await this.noteRepo.findById(id);
    if (!existing) {
      throw new Error('Note not found');
    }

    // Delete old mentions
    await this.mentionRepo.deleteByNoteId(id);

    // Update note
    const updated = await this.noteRepo.update(id, data.content);

    // Re-create mentions
    const mentionIds = extractMentions(data.content);
    for (const mentionId of mentionIds) {
      const positions = getMentionPositions(data.content, mentionId);
      for (const position of positions) {
        await this.mentionRepo.create({
          id: generateId(),
          fromNoteId: id,
          toNoteId: mentionId,
          position,
          createdAt: new Date(),
        });
      }
    }

    return updated;
  }
}

export const noteService = new NoteService();
