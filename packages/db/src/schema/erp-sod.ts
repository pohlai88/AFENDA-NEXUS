import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol } from './_common';

// ─── erp.sod_action_log ────────────────────────────────────────────────────

export const sodActionLog = erpSchema.table('sod_action_log', {
  ...pkId(),
  ...tenantCol(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  actorId: uuid('actor_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
