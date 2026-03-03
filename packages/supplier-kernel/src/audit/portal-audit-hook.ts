/**
 * SP-1005: Audit Log Middleware — Fastify hook for portal audit logging.
 *
 * Defines the PORT (interface) for audit log writing.
 * Actual Fastify hook registration happens in the route layer (AP module).
 */

import type { ActorType } from '../context/portal-request-context.js';

// ─── Audit Entry ────────────────────────────────────────────────────────────

export interface PortalAuditEntry {
  readonly tenantId: string;
  readonly actorId: string;
  readonly actorType: ActorType;
  readonly action: string;
  readonly resource: string;
  readonly resourceId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly timestamp: Date;
}

// ─── Audit Writer Port ──────────────────────────────────────────────────────

/**
 * Port for writing portal audit log entries.
 *
 * Implementation writes to `audit.audit_log` table.
 * Wired as a Fastify hook on all portal routes.
 */
export interface IPortalAuditWriter {
  /**
   * Write an audit entry for a portal action.
   *
   * @param entry The audit entry to write.
   * @param tx Optional transaction handle.
   */
  write(entry: PortalAuditEntry, tx?: unknown): Promise<void>;
}

/**
 * Build an audit entry from a PortalRequestContext and action details.
 * Pure function — no I/O.
 */
export function buildAuditEntry(params: {
  tenantId: string;
  actorId: string;
  actorType: ActorType;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): PortalAuditEntry {
  return {
    ...params,
    timestamp: new Date(),
  };
}
