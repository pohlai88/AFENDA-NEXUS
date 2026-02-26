/**
 * GAP-A1: SoD action log domain entity.
 *
 * Pure type — no DB imports, no I/O.
 * Records which actor performed which action on which entity,
 * enabling real-time SoD conflict detection.
 */
import type { FinancePermission } from '../ports/authorization.js';

export interface SoDActionLog {
  readonly id: string;
  readonly tenantId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly actorId: string;
  readonly action: FinancePermission;
  readonly createdAt: Date;
}
