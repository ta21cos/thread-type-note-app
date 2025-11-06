import { sqliteTable, text, integer, index, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './user.schema';

// NOTE: Stores refresh tokens with rotation support and PBKDF2 hashing
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references((): AnySQLiteColumn => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id'),
  tokenHash: text('token_hash').notNull(),
  issuedAt: integer('issued_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  rotatedFrom: text('rotated_from'),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  userDeviceIdx: index('idx_refresh_tokens_user_device').on(table.userId, table.deviceId),
  revokedIdx: index('idx_refresh_tokens_revoked').on(table.revokedAt),
}));

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
