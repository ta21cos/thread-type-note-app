import { eq, isNull, desc } from 'drizzle-orm';
import { db, sqlite, notes, type Note, type NewNote } from '../db';

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
    return db
      .select()
      .from(notes)
      .where(isNull(notes.parentId))
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset);
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
    // NOTE: SQLite recursive CTE to get full thread
    const query = sqlite.query(`
      WITH RECURSIVE thread AS (
        SELECT
          id,
          content,
          parent_id as parentId,
          created_at as createdAt,
          updated_at as updatedAt,
          depth
        FROM notes WHERE id = ?
        UNION ALL
        SELECT
          n.id,
          n.content,
          n.parent_id as parentId,
          n.created_at as createdAt,
          n.updated_at as updatedAt,
          n.depth
        FROM notes n
        JOIN thread t ON n.parent_id = t.id
      )
      SELECT * FROM thread ORDER BY depth, createdAt
    `);

    const results = query.all(rootId) as Note[];

    // NOTE: Convert Date objects to ISO strings for serialization
    return results.map(note => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt
    }));
  }
}
