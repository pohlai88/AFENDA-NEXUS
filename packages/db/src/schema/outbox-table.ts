import { sql } from "drizzle-orm";
import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";
import { erpSchema } from "./_schemas";
import { pkId, tenantCol } from "./_common";

// ─── erp.outbox ─────────────────────────────────────────────────────────────

export const outbox = erpSchema.table(
  "outbox",
  {
    ...pkId(),
    ...tenantCol(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_outbox_unprocessed").on(t.createdAt).where(sql`${t.processedAt} IS NULL`),
  ],
);
