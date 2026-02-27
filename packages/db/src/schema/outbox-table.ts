import { sql } from 'drizzle-orm';
import { index, jsonb, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol } from './_common';

// ─── erp.outbox ─────────────────────────────────────────────────────────────

export const outbox = erpSchema.table(
  'outbox',
  {
    ...pkId(),
    ...tenantCol(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    correlationId: uuid('correlation_id'),
    contentHash: varchar('content_hash', { length: 64 }),
    previousHash: varchar('previous_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_outbox_unprocessed')
      .on(t.tenantId, t.createdAt)
      .where(sql`${t.processedAt} IS NULL`),
  ]
).enableRLS();
