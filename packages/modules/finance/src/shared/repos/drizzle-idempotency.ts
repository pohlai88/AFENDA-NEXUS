import { sql, eq, and } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { idempotencyStore } from '@afenda/db';
import type {
  IIdempotencyStore,
  IdempotencyClaimInput,
  IdempotencyResult,
} from '../ports/idempotency-store.js';

/**
 * Atomic idempotency store using INSERT ... ON CONFLICT DO NOTHING.
 *
 * Backed by erp.idempotency_store with UNIQUE(tenant_id, idempotency_key, command_type).
 * Uses pg_advisory_xact_lock to serialize within the transaction, then
 * Drizzle query builder for the actual check + insert.
 */
export class DrizzleIdempotencyStore implements IIdempotencyStore {
  constructor(private readonly tx: TenantTx) {}

  async claimOrGet(input: IdempotencyClaimInput): Promise<IdempotencyResult> {
    // Attempt atomic claim via advisory lock + conditional insert pattern.
    // Uses pg_advisory_xact_lock to serialize within the transaction.
    const lockKey = this.hashKey(input.key, input.commandType);

    await this.tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

    // Check if already exists
    const [existing] = await this.tx
      .select({ resultRef: idempotencyStore.resultRef })
      .from(idempotencyStore)
      .where(
        and(
          eq(idempotencyStore.tenantId, input.tenantId),
          eq(idempotencyStore.idempotencyKey, input.key),
          eq(idempotencyStore.commandType, input.commandType)
        )
      )
      .limit(1);

    if (existing) {
      return { claimed: false, resultRef: existing.resultRef ?? undefined };
    }

    // Claim it
    await this.tx
      .insert(idempotencyStore)
      .values({
        tenantId: input.tenantId,
        idempotencyKey: input.key,
        commandType: input.commandType,
        resultRef: input.resultRef ?? null,
      })
      .onConflictDoNothing();

    return { claimed: true };
  }

  async recordOutcome(
    tenantId: string,
    key: string,
    commandType: string,
    resultRef: string
  ): Promise<void> {
    await this.tx
      .update(idempotencyStore)
      .set({ resultRef })
      .where(
        and(
          eq(idempotencyStore.tenantId, tenantId),
          eq(idempotencyStore.idempotencyKey, key),
          eq(idempotencyStore.commandType, commandType)
        )
      );
  }

  private hashKey(key: string, commandType: string): number {
    let hash = 0;
    const str = `${key}:${commandType}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return hash;
  }
}
