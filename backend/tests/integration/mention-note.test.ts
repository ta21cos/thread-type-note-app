import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes, mentions } from '../../src/db';

// NOTE: Integration test for mention functionality
// This test MUST fail until services are implemented
describe('Mention Another Note Scenario', () => {
  beforeEach(async () => {
    await db.delete(mentions);
    await db.delete(notes);
  });

  it('should extract and save mention from @ID syntax', async () => {
    const noteService = await import('../../src/services/note.service');

    const note1 = await noteService.createNote({ content: 'First note' });
    const note2 = await noteService.createNote({
      content: `Mentioning @${note1.id} in this note`,
    });

    const mentionService = await import('../../src/services/mention.service');
    const mentionsForNote1 = await mentionService.getMentions(note1.id);

    expect(mentionsForNote1).toHaveLength(1);
    expect(mentionsForNote1[0].fromNoteId).toBe(note2.id);
    expect(mentionsForNote1[0].toNoteId).toBe(note1.id);
  });

  it('should handle multiple mentions in one note', async () => {
    const noteService = await import('../../src/services/note.service');

    const note1 = await noteService.createNote({ content: 'Note 1' });
    const note2 = await noteService.createNote({ content: 'Note 2' });
    const note3 = await noteService.createNote({
      content: `Mentioning @${note1.id} and @${note2.id}`,
    });

    const mentionService = await import('../../src/services/mention.service');
    const mentions1 = await mentionService.getMentions(note1.id);
    const mentions2 = await mentionService.getMentions(note2.id);

    expect(mentions1).toHaveLength(1);
    expect(mentions2).toHaveLength(1);
  });
});
