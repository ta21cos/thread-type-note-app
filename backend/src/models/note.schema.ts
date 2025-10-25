import { sqliteTable, text, integer, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// NOTE: Drizzle schema for Note entity with 1000 char limit (from clarifications)
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  parentId: text('parent_id').references((): AnySQLiteColumn => notes.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  depth: integer('depth').notNull().default(0),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
