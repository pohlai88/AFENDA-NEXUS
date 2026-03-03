/**
 * Phase 1.1.4: Audit Trail service (CAP-AUDIT).
 *
 * Provides a supplier-facing, filtered, read-only view of the
 * `audit.audit_log` table. Entries are scoped to supplier-relevant
 * tables and the requesting supplier's tenant.
 *
 * No write operations — audit log writes are handled by the
 * IPortalAuditWriter hook (SP-1005) already wired in the route layer.
 */

import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ISupplierRepo } from '../ports/supplier-repo.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuditLogRow {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string | null;
  readonly action: string;
  readonly tableName: string;
  readonly recordId: string | null;
  readonly ipAddress: string | null;
  readonly occurredAt: Date;
}

export interface AuditLogEntry {
  readonly id: string;
  readonly action: string;
  readonly resource: string;
  readonly resourceId: string | null;
  readonly actorId: string | null;
  readonly ipAddress: string | null;
  readonly occurredAt: string;
  readonly description: string;
}

export interface AuditLogListResult {
  readonly items: readonly AuditLogEntry[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

// ─── Supplier-relevant tables ───────────────────────────────────────────────

/**
 * Tables whose audit entries are visible to supplier portal users.
 * Maps DB table names to human-readable resource labels.
 */
const SUPPLIER_TABLES: ReadonlyMap<string, string> = new Map([
  ['supplier', 'Profile'],
  ['supplier_invoice', 'Invoice'],
  ['supplier_case', 'Case'],
  ['supplier_case_timeline', 'Case Timeline'],
  ['supplier_document', 'Document'],
  ['supplier_bank_account', 'Bank Account'],
  ['supplier_compliance_item', 'Compliance Item'],
  ['supplier_compliance_alert_log', 'Compliance Alert'],
  ['supplier_dispute', 'Dispute'],
  ['supplier_onboarding', 'Onboarding'],
  ['supplier_message', 'Message'],
]);

const SUPPLIER_TABLE_NAMES = [...SUPPLIER_TABLES.keys()];

/**
 * Map raw DB action verbs to human-readable descriptions.
 */
const ACTION_LABELS: ReadonlyMap<string, string> = new Map([
  ['INSERT', 'Created'],
  ['UPDATE', 'Updated'],
  ['DELETE', 'Deleted'],
  ['LOGIN', 'Logged in'],
  ['LOGOUT', 'Logged out'],
  ['SUBMIT', 'Submitted'],
  ['APPROVE', 'Approved'],
  ['REJECT', 'Rejected'],
  ['UPLOAD', 'Uploaded'],
  ['RENEW', 'Renewed'],
  ['ESCALATE', 'Escalated'],
]);

function buildDescription(action: string, tableName: string): string {
  const actionLabel = ACTION_LABELS.get(action) ?? action;
  const resourceLabel = SUPPLIER_TABLES.get(tableName) ?? tableName;
  return `${actionLabel} ${resourceLabel}`;
}

// ─── Port ───────────────────────────────────────────────────────────────────

export interface IAuditLogRepo {
  /**
   * Query audit log entries for supplier-visible tables within a tenant.
   *
   * @param tenantId   Tenant scope
   * @param tables     Array of table names to include
   * @param filters    Optional action/resource filters
   * @param page       1-based page number
   * @param limit      Page size
   * @returns          Rows + total count for pagination
   */
  findByTenantAndTables(
    tenantId: string,
    tables: readonly string[],
    filters: { action?: string; resource?: string },
    page: number,
    limit: number
  ): Promise<{ rows: readonly AuditLogRow[]; total: number }>;
}

// ─── Input ──────────────────────────────────────────────────────────────────

export interface GetAuditLogInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly page: number;
  readonly limit: number;
  readonly action?: string;
  readonly resource?: string;
}

// ─── Deps ───────────────────────────────────────────────────────────────────

export interface AuditServiceDeps {
  readonly supplierRepo: ISupplierRepo;
  readonly auditLogRepo: IAuditLogRepo;
}

// ─── Service Function ───────────────────────────────────────────────────────

/**
 * Retrieve paginated, supplier-scoped audit log entries.
 *
 * 1. Validates supplier exists and belongs to tenant.
 * 2. Queries audit_log for supplier-relevant tables.
 * 3. Maps rows to supplier-friendly AuditLogEntry shapes.
 */
export async function getSupplierAuditLog(
  input: GetAuditLogInput,
  deps: AuditServiceDeps
): Promise<Result<AuditLogListResult>> {
  // Validate supplier exists and belongs to tenant
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.tenantId !== input.tenantId) {
    return err(new AppError('FORBIDDEN', 'Tenant mismatch'));
  }

  // Determine which tables to query
  const targetTables = input.resource
    ? SUPPLIER_TABLE_NAMES.filter((t) => t === input.resource)
    : SUPPLIER_TABLE_NAMES;

  if (targetTables.length === 0) {
    return ok({ items: [], total: 0, page: input.page, limit: input.limit });
  }

  // Query the audit log repo
  const { rows, total } = await deps.auditLogRepo.findByTenantAndTables(
    input.tenantId,
    targetTables,
    { action: input.action },
    input.page,
    input.limit
  );

  // Map to supplier-facing shape
  const items: AuditLogEntry[] = rows.map((row) => ({
    id: row.id,
    action: row.action,
    resource: row.tableName,
    resourceId: row.recordId,
    actorId: row.userId,
    ipAddress: row.ipAddress,
    occurredAt: row.occurredAt.toISOString(),
    description: buildDescription(row.action, row.tableName),
  }));

  return ok({
    items,
    total,
    page: input.page,
    limit: input.limit,
  });
}
