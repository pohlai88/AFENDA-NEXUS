/**
 * GAP-A1: SoD action log repository port.
 *
 * Defines the contract for persisting and querying SoD action evidence.
 * Implementations must store structured, queryable columns —
 * no free-form string parsing allowed.
 */
import type { FinancePermission } from './authorization.js';
import type { SoDActionLog } from '../entities/sod-action-log.js';

export interface SoDLogInput {
  readonly tenantId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly actorId: string;
  readonly action: FinancePermission;
}

export interface ISoDActionLogRepo {
  logAction(input: SoDLogInput): Promise<void>;
  findByEntity(tenantId: string, entityType: string, entityId: string): Promise<SoDActionLog[]>;
}
