/**
 * GAP-A1: Drizzle implementation of ISoDActionLogRepo.
 *
 * Writes to erp.sod_action_log — a dedicated table with structured,
 * queryable columns. No JSONB parsing, no free-form string matching.
 */
import { and, eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { sodActionLog } from '@afenda/db';
import type { SoDActionLog } from '../entities/sod-action-log.js';
import type { ISoDActionLogRepo, SoDLogInput } from '../ports/sod-action-log-repo.js';
import type { FinancePermission } from '../ports/authorization.js';

export class DrizzleSoDActionLogRepo implements ISoDActionLogRepo {
  constructor(private readonly tx: TenantTx) {}

  async logAction(input: SoDLogInput): Promise<void> {
    await this.tx.insert(sodActionLog).values({
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      action: input.action,
    });
  }

  async findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<SoDActionLog[]> {
    const rows = await this.tx
      .select()
      .from(sodActionLog)
      .where(
        and(
          eq(sodActionLog.tenantId, tenantId),
          eq(sodActionLog.entityType, entityType),
          eq(sodActionLog.entityId, entityId)
        )
      );

    return rows.map((r) => ({
      id: r.id!,
      tenantId: r.tenantId,
      entityType: r.entityType,
      entityId: r.entityId,
      actorId: r.actorId,
      action: r.action as FinancePermission,
      createdAt: r.createdAt,
    }));
  }
}
