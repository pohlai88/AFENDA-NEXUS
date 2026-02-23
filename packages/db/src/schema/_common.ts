import { sql } from "drizzle-orm";
import { bigint, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * UUIDv7 primary key with DB-native default via pg_uuidv7 extension.
 * Time-ordered for B-tree locality. No app-side generation needed.
 * Usage: { ...pkId(), ... } in table column definitions.
 */
export function pkId() {
  return {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  } as const;
}

/**
 * Tenant ID column — required on every tenant-owned table.
 * Usage: { ...pkId(), ...tenantCol(), ... }
 */
export function tenantCol() {
  return {
    tenantId: uuid("tenant_id").notNull(),
  } as const;
}

/**
 * Standard created_at / updated_at timestamps with timezone.
 * Usage: { ...timestamps(), ... } at the end of column definitions.
 */
export function timestamps() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  } as const;
}

/**
 * Money stored as bigint in minor units (cents/pence).
 * Maps DB bigint ↔ TS bigint with no floating-point precision loss.
 *
 * Uses native drizzle-orm bigint with mode:"bigint" so drizzle-kit
 * can serialize snapshots (customType caused BigInt JSON.stringify errors).
 */
export function moneyBigint(name: string) {
  return bigint(name, { mode: "bigint" });
}
