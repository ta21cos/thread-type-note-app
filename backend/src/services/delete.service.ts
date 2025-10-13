import { NoteRepository } from '../repositories/note.repository';
import { MentionRepository } from '../repositories/mention.repository';

// NOTE: Service for cascade deletion logic (application-level)
export class DeleteService {
  private noteRepo = new NoteRepository();
  private mentionRepo = new MentionRepository();

  async deleteNote(id: string): Promise<void> {
    const note = await this.noteRepo.findById(id);
    if (!note) {
      throw new Error('Note not found');
    }

    // NOTE: Application-level cascade deletion
    // Get all child notes (only 1 level deep due to 2-level constraint)
    const children = await this.noteRepo.findByParentId(id);

    // Delete mentions for parent and all children
    await this.mentionRepo.deleteByNoteId(id);
    for (const child of children) {
      await this.mentionRepo.deleteByNoteId(child.id);
    }

    // Delete all child notes
    for (const child of children) {
      await this.noteRepo.delete(child.id);
    }

    // Finally delete the parent note
    await this.noteRepo.delete(id);
  }
}

export const deleteService = new DeleteService();
