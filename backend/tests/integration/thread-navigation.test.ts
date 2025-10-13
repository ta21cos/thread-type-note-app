import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';

// NOTE: Integration test for thread navigation
// This test MUST fail until services are implemented
describe('Navigate Thread Hierarchy Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should navigate from any note to thread root', async () => {
    const noteService = await import('../../src/services/note.service');
    const threadService = await import('../../src/services/thread.service');

    const root = await noteService.createNote({ content: 'Root' });
    const child = await noteService.createNote({
      content: 'Child',
      parentId: root.id,
    });
    const grandchild = await noteService.createNote({
      content: 'Grandchild',
      parentId: child.id,
    });

    const thread = await threadService.getThread(grandchild.id);

    expect(thread[0].id).toBe(root.id);
    expect(thread).toHaveLength(3);
  });

  it('should show threaded/nested format with parent-child relationships', async () => {
    const noteService = await import('../../src/services/note.service');
    const threadService = await import('../../src/services/thread.service');

    const parent = await noteService.createNote({ content: 'Parent' });
    const child1 = await noteService.createNote({
      content: 'Child 1',
      parentId: parent.id,
    });
    const child2 = await noteService.createNote({
      content: 'Child 2',
      parentId: parent.id,
    });

    const thread = await threadService.getThread(parent.id);

    expect(thread).toHaveLength(3);
    expect(thread.filter((n) => n.parentId === parent.id)).toHaveLength(2);
  });
});
