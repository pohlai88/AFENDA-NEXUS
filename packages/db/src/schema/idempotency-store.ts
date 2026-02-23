import { sql } from "drizzle-orm";
import { text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { erpSchema } from "./_schemas";
import { pkId, tenantCol } from "./_common";

// ─── erp.idempotency_store ─────────────────────────────────────────────────

export const idempotencyStore = erpSchema.table(
  "idempotency_store",
  {
    ...pkId(),
    ...tenantCol(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    commandType: varchar("command_type", { length: 100 }).notNull(),
    resultRef: text("result_ref"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex("uq_idempotency_tenant_key_cmd").on(
      t.tenantId,
      t.idempotencyKey,
      t.commandType,
    ),
  ],
);
