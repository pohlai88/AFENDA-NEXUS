import { sql } from 'drizzle-orm';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { DbClient } from './client.js';
import type * as schema from './schema/index.js';

export type TenantTx = PgTransaction<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export interface DbSessionOptions {
  db: DbClient;
  logger?: { info: (msg: string) => void; error: (msg: string) => void };
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  companyId?: string;
}

export interface DbSession {
  readonly db: DbClient;

  /**
   * Execute a callback inside a transaction with tenant context.
   *
   * SET LOCAL is transaction-scoped — it ONLY works inside a transaction.
   * On Neon PgBouncer (transaction mode), the connection is returned to the
   * pool after the transaction completes, so SET LOCAL is automatically
   * cleaned up. No explicit RESET needed.
   *
   * Flow:
   *   BEGIN
   *   SET LOCAL app.tenant_id = '<tenantId>'
   *   SET LOCAL app.user_id = '<userId>'
   *   SET LOCAL ROLE app_runtime
   *   ... your queries (RLS enforced) ...
   *   COMMIT / ROLLBACK
   *   -- connection returned to pool, all SET LOCAL values discarded
   */
  withTenant<T>(ctx: TenantContext, fn: (tx: TenantTx) => Promise<T>): Promise<T>;

  /**
   * Execute a callback inside a transaction with tenant + company context.
   * Sets app.tenant_id, app.company_id, app.user_id, and ROLE app_runtime.
   * Use for company-scoped operations (GL, AP, AR, IC) — defense-in-depth.
   */
  withTenantAndCompany<T>(
    ctx: TenantContext & { companyId: string },
    fn: (tx: TenantTx) => Promise<T>
  ): Promise<T>;
}

/**
 * Creates a DbSession wrapping a Drizzle client with tenant context.
 *
 * Every tenant-scoped operation MUST go through withTenant() to ensure
 * SET LOCAL is inside a transaction. Calling SET LOCAL outside a tx
 * has no effect on Neon PgBouncer (transaction mode).
 */
export function createDbSession(opts: DbSessionOptions): DbSession {
  const { db, logger } = opts;
  const rlsEnforced = process.env.RLS_ENFORCED !== 'false';

  return {
    db,
    async withTenant<T>(ctx: TenantContext, fn: (tx: TenantTx) => Promise<T>): Promise<T> {
      return db.transaction(async (tx) => {
        logger?.info(`Tenant context: ${ctx.tenantId}`);
        await tx.execute(sql`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`);
        if (ctx.userId) {
          await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
        }
        if (rlsEnforced) {
          await tx.execute(sql`SET LOCAL ROLE app_runtime`);
        }
        return fn(tx);
      });
    },
    async withTenantAndCompany<T>(
      ctx: TenantContext & { companyId: string },
      fn: (tx: TenantTx) => Promise<T>
    ): Promise<T> {
      return db.transaction(async (tx) => {
        logger?.info(`Tenant+company context: ${ctx.tenantId} / ${ctx.companyId}`);
        await tx.execute(sql`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`);
        await tx.execute(sql`SELECT set_config('app.company_id', ${ctx.companyId}, true)`);
        if (ctx.userId) {
          await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
        }
        if (rlsEnforced) {
          await tx.execute(sql`SET LOCAL ROLE app_runtime`);
        }
        return fn(tx);
      });
    },
  };
}
