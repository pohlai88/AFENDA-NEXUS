import { jsonb, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { auditSchema } from "./_schemas";
import { pkId, tenantCol } from "./_common";

// ─── audit.audit_log ────────────────────────────────────────────────────────

export const auditLogs = auditSchema.table("audit_log", {
  ...pkId(),
  ...tenantCol(),
  userId: uuid("user_id"),
  action: varchar("action", { length: 50 }).notNull(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: uuid("record_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});
