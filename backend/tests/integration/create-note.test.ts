import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { NoteService } from '../../src/services/note.service';
import { ThreadService } from '../../src/services/thread.service';

// NOTE: Integration test for creating first note scenario
// This test MUST fail until services are implemented
describe('Create First Note Scenario', () => {
  let noteService: NoteService;
  let threadService: ThreadService;

  beforeEach(async () => {
    // Clean database before each test
    await db.delete(notes);
    // Initialize services
    noteService = new NoteService();
    threadService = new ThreadService();
  });

  it('should create and save first note as root', async () => {
    const result = await noteService.createNote({
      content: 'My first note',
    });

    expect(result.id).toBeDefined();
    expect(result.content).toBe('My first note');
    expect(result.parentId).toBeNull();
    expect(result.depth).toBe(0);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should display note in standalone thread', async () => {
    const note = await noteService.createNote({ content: 'Test' });
    const thread = await threadService.getThread(note.id);

    expect(thread).toHaveLength(1);
    expect(thread[0].id).toBe(note.id);
  });
});
