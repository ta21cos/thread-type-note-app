import { NoteRepository } from '../repositories/note.repository';

// NOTE: Service for cascade deletion logic
export class DeleteService {
  private noteRepo = new NoteRepository();

  async deleteNote(id: string): Promise<void> {
    const note = await this.noteRepo.findById(id);
    if (!note) {
      throw new Error('Note not found');
    }

    // NOTE: Cascade deletion is handled by database ON DELETE CASCADE
    // This will automatically delete all child notes and mentions
    await this.noteRepo.delete(id);
  }
}

export const deleteService = new DeleteService();
