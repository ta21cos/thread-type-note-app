import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// NOTE: Security audit logging with nullable userId for failed login attempts
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  action: text('action').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  details: text('details'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('idx_audit_logs_user').on(table.userId, table.createdAt),
  actionIdx: index('idx_audit_logs_action').on(table.action, table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
