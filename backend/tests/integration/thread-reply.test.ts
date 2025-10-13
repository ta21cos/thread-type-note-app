import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { noteService } from '../../src/services/note.service';
import { threadService } from '../../src/services/thread.service';

// NOTE: Integration test for thread reply scenario
describe('Reply to Note (Thread) Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should create reply nested under parent note', async () => {
    const parent = await noteService.createNote({ content: 'Parent note' });
    const reply = await noteService.createNote({
      content: 'Reply to parent',
      parentId: parent.id,
    });

    expect(reply.parentId).toBe(parent.id);
    expect(reply.depth).toBe(1);
  });

  it('should maintain thread hierarchy', async () => {
    // NOTE: Only 2 levels allowed - parent and children
    const root = await noteService.createNote({ content: 'Root' });
    const reply1 = await noteService.createNote({
      content: 'Reply 1',
      parentId: root.id,
    });
    const reply2 = await noteService.createNote({
      content: 'Reply 2',
      parentId: root.id, // Both replies to the same parent
    });

    const thread = await threadService.getThread(root.id);

    expect(thread).toHaveLength(3);
    expect(thread[0].depth).toBe(0); // Root
    expect(thread[1].depth).toBe(1); // Reply 1
    expect(thread[2].depth).toBe(1); // Reply 2 (same level as Reply 1)
  });
});
