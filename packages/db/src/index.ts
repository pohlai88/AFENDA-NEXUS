/**
 * @afenda/db — Drizzle schema, migrations, RLS policies, DbSession, tenant context.
 *
 * The ONLY package that touches Drizzle/SQL directly.
 * Never imports @afenda/platform — logger/config injected by apps.
 * Never imports @afenda/modules/* — modules import db, not the other way.
 */

// ─── Schema ─────────────────────────────────────────────────────────────────

export * from "./schema/index.js";

// ─── Client ─────────────────────────────────────────────────────────────────

export {
  createPooledClient,
  createDirectClient,
  type ConnectionOptions,
  type DbClient,
} from "./client.js";

// ─── Session ────────────────────────────────────────────────────────────────

export {
  createDbSession,
  type DbSession,
  type DbSessionOptions,
  type TenantContext,
  type TenantTx,
} from "./session.js";

// ─── Migrate ────────────────────────────────────────────────────────────────

export { migrate } from "./migrate.js";

// ─── Seed ───────────────────────────────────────────────────────────────────

export { seed } from "./seed.js";

// ─── Prepared Queries ───────────────────────────────────────────────────────

export { createPreparedQueries } from "./prepared.js";

// ─── Health Check ──────────────────────────────────────────────────────────

export { createHealthCheck } from "./health.js";

// ─── Outbox ────────────────────────────────────────────────────────────────

export type { OutboxRow, OutboxWriter, OutboxDrainer } from "./schema/outbox.js";
export { createOutboxDrainer } from "./outbox-drainer.js";

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type * from "./types.js";
