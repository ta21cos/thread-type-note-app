import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';

// NOTE: Integration test for thread reply scenario
// This test MUST fail until services are implemented
describe('Reply to Note (Thread) Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should create reply nested under parent note', async () => {
    const noteService = await import('../../src/services/note.service');

    const parent = await noteService.createNote({ content: 'Parent note' });
    const reply = await noteService.createNote({
      content: 'Reply to parent',
      parentId: parent.id,
    });

    expect(reply.parentId).toBe(parent.id);
    expect(reply.depth).toBe(1);
  });

  it('should maintain thread hierarchy', async () => {
    const noteService = await import('../../src/services/note.service');
    const threadService = await import('../../src/services/thread.service');

    const root = await noteService.createNote({ content: 'Root' });
    const reply1 = await noteService.createNote({
      content: 'Reply 1',
      parentId: root.id,
    });
    const reply2 = await noteService.createNote({
      content: 'Reply 2',
      parentId: reply1.id,
    });

    const thread = await threadService.getThread(root.id);

    expect(thread).toHaveLength(3);
    expect(thread[0].depth).toBe(0);
    expect(thread[1].depth).toBe(1);
    expect(thread[2].depth).toBe(2);
  });
});
