/**
 * Drizzle-based OutboxDrainer — reads unprocessed outbox rows and marks them processed.
 *
 * Used by the worker process to drain the transactional outbox.
 * Selects oldest unprocessed rows with FOR UPDATE SKIP LOCKED for safe concurrency.
 */
import { sql, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { outbox } from "./schema/index.js";
import type { OutboxRow, OutboxDrainer } from "./schema/outbox.js";

interface OutboxDbRow {
  id: string;
  tenant_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: Date;
  processed_at: Date | null;
}

export function createOutboxDrainer(db: DbClient): OutboxDrainer {
  return {
    async drain(batchSize: number): Promise<OutboxRow[]> {
      // Use raw SQL for FOR UPDATE SKIP LOCKED — Drizzle query builder
      // doesn't expose .for() on all drivers.
      const result = await db.execute(
        sql`SELECT id, tenant_id, event_type, payload, created_at, processed_at
            FROM erp.outbox
            WHERE processed_at IS NULL
            ORDER BY created_at ASC
            LIMIT ${batchSize}
            FOR UPDATE SKIP LOCKED`,
      );

      const rows = (Array.isArray(result) ? result : (result as unknown as { rows: OutboxDbRow[] }).rows ?? []) as unknown as OutboxDbRow[];

      return rows.map((r) => ({
        id: r.id,
        tenantId: r.tenant_id,
        eventType: r.event_type,
        payload: (r.payload ?? {}) as Record<string, unknown>,
        createdAt: r.created_at,
        processedAt: r.processed_at,
      }));
    },

    async markProcessed(id: string): Promise<void> {
      await db
        .update(outbox)
        .set({ processedAt: sql`now()` })
        .where(eq(outbox.id, id));
    },
  };
}
