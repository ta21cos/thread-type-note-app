import { sqliteTable, text, integer, unique, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './user.schema';

// NOTE: Links Auth0 identities to local users with unique constraint on provider+subject
export const externalIdentities = sqliteTable('external_identities', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  subject: text('subject').notNull(),
  email: text('email'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  providerSubjectUnique: unique('provider_subject_unique').on(table.provider, table.subject),
}));

export type ExternalIdentity = typeof externalIdentities.$inferSelect;
export type NewExternalIdentity = typeof externalIdentities.$inferInsert;
