import { eq, isNull, desc, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { db, notes, type Note, type NewNote } from '../db';

// NOTE: Repository for Note CRUD operations
export class NoteRepository {
  async create(note: NewNote): Promise<Note> {
    const [created] = await db.insert(notes).values(note).returning();
    return created;
  }

  async findById(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async findRootNotes(limit: number, offset: number): Promise<Note[]> {
    // NOTE: Create alias for child notes to avoid ambiguous column names in self-join
    const childNotes = alias(notes, 'child_notes');

    const results = await db
      .select({
        id: notes.id,
        content: notes.content,
        parentId: notes.parentId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        depth: notes.depth,
        replyCount: sql<number>`COUNT(${childNotes.id})`.mapWith(Number),
      })
      .from(notes)
      .leftJoin(childNotes, eq(childNotes.parentId, notes.id))
      .where(isNull(notes.parentId))
      .groupBy(notes.id)
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset);

    // NOTE: Convert dates to ISO strings and ensure replyCount is a number
    return results.map(note => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
      replyCount: Number(note.replyCount) || 0,
    }));
  }

  async countRootNotes(): Promise<number> {
    const result = await db
      .select({ count: notes.id })
      .from(notes)
      .where(isNull(notes.parentId));
    return result.length;
  }

  async update(id: string, content: string): Promise<Note> {
    const [updated] = await db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  async findByParentId(parentId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.parentId, parentId));
  }

  async getThreadRecursive(rootId: string): Promise<Note[]> {
    // NOTE: Use Drizzle ORM queries instead of raw SQL for D1 compatibility
    // This approach uses breadth-first traversal to build the thread
    const result: Note[] = [];
    const queue: string[] = [rootId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      // Skip if already processed
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      // Fetch current note
      const [currentNote] = await db
        .select()
        .from(notes)
        .where(eq(notes.id, currentId));

      if (!currentNote) {
        continue;
      }

      // Add to result
      result.push(currentNote);

      // Fetch children and add to queue
      const children = await db
        .select()
        .from(notes)
        .where(eq(notes.parentId, currentId))
        .orderBy(asc(notes.createdAt));

      // Add children to queue
      for (const child of children) {
        queue.push(child.id);
      }
    }

    // Sort by depth and createdAt to maintain order
    result.sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    });

    // NOTE: Convert Date objects to ISO strings for serialization
    return result.map((note: Note) => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
    }));
  }
}
