import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';

// NOTE: Integration test for circular reference prevention (from clarifications)
// This test MUST fail until services are implemented
describe('Prevent Circular References Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should detect and prevent circular mentions using DFS', async () => {
    const noteService = await import('../../src/services/note.service');
    const mentionService = await import('../../src/services/mention.service');

    // Create notes: A mentions B, B mentions C
    const noteA = await noteService.createNote({ content: 'Note A' });
    const noteB = await noteService.createNote({ content: `Mentions @${noteA.id}` });
    const noteC = await noteService.createNote({ content: `Mentions @${noteB.id}` });

    // Attempt to create circular reference: C mentions A (would create cycle A->B->C->A)
    await expect(
      mentionService.validateMentions(noteC.id, [noteA.id])
    ).rejects.toThrow(/circular/i);
  });

  it('should allow non-circular mention chains', async () => {
    const noteService = await import('../../src/services/note.service');
    const mentionService = await import('../../src/services/mention.service');

    const noteA = await noteService.createNote({ content: 'A' });
    const noteB = await noteService.createNote({ content: `@${noteA.id}` });
    const noteC = await noteService.createNote({ content: `@${noteB.id}` });
    const noteD = await noteService.createNote({ content: `@${noteC.id}` });

    // This is a valid chain: A <- B <- C <- D (no cycle)
    await expect(
      mentionService.validateMentions(noteD.id, [noteC.id])
    ).resolves.not.toThrow();
  });

  it('should display error message when circular reference detected', async () => {
    const noteService = await import('../../src/services/note.service');

    const noteA = await noteService.createNote({ content: 'A' });
    const noteB = await noteService.createNote({ content: `@${noteA.id}` });

    // Attempt to create circle
    await expect(
      noteService.createNote({ content: `@${noteB.id}`, mentions: [noteB.id] })
    ).rejects.toThrow();
  });
});
