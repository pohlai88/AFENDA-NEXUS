import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { IProofChainWriter, ProofEventType } from '@afenda/supplier-kernel';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

/**
 * N11: Supplier compliance status tracking.
 *
 * Tracks KYC status, tax clearance validity, insurance expiry,
 * and other compliance requirements per supplier. Suppliers can
 * view their compliance status; internal users can update it.
 * Expired items block payment runs via hold integration.
 */

export type ComplianceItemType =
  | 'KYC'
  | 'TAX_CLEARANCE'
  | 'INSURANCE_LIABILITY'
  | 'INSURANCE_WORKERS_COMP'
  | 'BEE_CERTIFICATE'
  | 'BANK_CONFIRMATION'
  | 'TRADE_LICENSE'
  | 'OTHER';

export type ComplianceStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING' | 'NOT_SUBMITTED';

export interface SupplierComplianceItem {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly itemType: ComplianceItemType;
  readonly status: ComplianceStatus;
  readonly issuedDate: Date | null;
  readonly expiryDate: Date | null;
  readonly documentId: string | null;
  readonly notes: string | null;
  readonly lastVerifiedBy: string | null;
  readonly lastVerifiedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierComplianceSummary {
  readonly supplierId: string;
  readonly items: readonly SupplierComplianceItem[];
  readonly overallStatus: ComplianceStatus;
  readonly expiredCount: number;
  readonly expiringSoonCount: number;
  readonly pendingCount: number;
}

export interface ISupplierComplianceRepo {
  findBySupplierId(supplierId: string): Promise<readonly SupplierComplianceItem[]>;
  findById(id: string): Promise<SupplierComplianceItem | null>;
  findExpiringByTenant(tenantId: string): Promise<readonly SupplierComplianceItem[]>;
  upsert(item: SupplierComplianceItem): Promise<SupplierComplianceItem>;
}

export interface GetComplianceSummaryInput {
  readonly tenantId: string;
  readonly supplierId: string;
}

const EXPIRING_SOON_DAYS = 30;

function computeStatus(item: SupplierComplianceItem, now: Date): ComplianceStatus {
  if (!item.expiryDate) return item.status;
  if (item.expiryDate < now) return 'EXPIRED';
  const daysUntilExpiry = Math.floor(
    (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilExpiry <= EXPIRING_SOON_DAYS) return 'EXPIRING_SOON';
  return 'VALID';
}

function computeOverallStatus(statuses: readonly ComplianceStatus[]): ComplianceStatus {
  if (statuses.some((s) => s === 'EXPIRED')) return 'EXPIRED';
  if (statuses.some((s) => s === 'PENDING' || s === 'NOT_SUBMITTED')) return 'PENDING';
  if (statuses.some((s) => s === 'EXPIRING_SOON')) return 'EXPIRING_SOON';
  return 'VALID';
}

/**
 * Get supplier compliance summary with live status computation.
 */
export async function supplierGetComplianceSummary(
  input: GetComplianceSummaryInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierComplianceRepo: ISupplierComplianceRepo;
  }
): Promise<Result<SupplierComplianceSummary>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }

  const items = await deps.supplierComplianceRepo.findBySupplierId(input.supplierId);
  const now = new Date();

  const enrichedItems = items.map((item) => ({
    ...item,
    status: computeStatus(item, now),
  }));

  const statuses = enrichedItems.map((i) => i.status);
  const expiredCount = statuses.filter((s) => s === 'EXPIRED').length;
  const expiringSoonCount = statuses.filter((s) => s === 'EXPIRING_SOON').length;
  const pendingCount = statuses.filter((s) => s === 'PENDING' || s === 'NOT_SUBMITTED').length;

  return ok({
    supplierId: input.supplierId,
    items: enrichedItems,
    overallStatus: computeOverallStatus(statuses),
    expiredCount,
    expiringSoonCount,
    pendingCount,
  });
}

// ─── Phase 1.1.3: Compliance Expiry Alerts (CAP-COMPL) ─────────────────────

/**
 * Alert threshold types — matches the DB enum.
 * Ordered by urgency: 30d → 14d → 7d → expired.
 */
export type ComplianceAlertType = 'EXPIRING_30D' | 'EXPIRING_14D' | 'EXPIRING_7D' | 'EXPIRED';

/** Threshold configuration for the cron scanner. */
export const ALERT_THRESHOLDS: ReadonlyArray<{
  type: ComplianceAlertType;
  days: number;
}> = [
  { type: 'EXPIRED', days: 0 },
  { type: 'EXPIRING_7D', days: 7 },
  { type: 'EXPIRING_14D', days: 14 },
  { type: 'EXPIRING_30D', days: 30 },
];

export interface ComplianceAlertLogEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly complianceItemId: string;
  readonly supplierId: string;
  readonly alertType: ComplianceAlertType;
  readonly alertedAt: Date;
  readonly supersededAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ComplianceTimelineEntry {
  readonly id: string;
  readonly itemType: ComplianceItemType;
  readonly eventType: string;
  readonly actorId: string | null;
  readonly actorType: 'SUPPLIER' | 'BUYER' | 'SYSTEM' | null;
  readonly details: Record<string, unknown>;
  readonly createdAt: Date;
}

/**
 * Repository port for compliance alert log.
 * Implementations live in the infrastructure layer.
 */
export interface IComplianceAlertLogRepo {
  /** Check if an alert of this type has already been sent for this item. */
  findActiveAlert(
    tenantId: string,
    complianceItemId: string,
    alertType: ComplianceAlertType
  ): Promise<ComplianceAlertLogEntry | null>;

  /** Record a new alert dispatch. */
  create(entry: ComplianceAlertLogEntry): Promise<ComplianceAlertLogEntry>;

  /** Supersede existing alerts for a compliance item (after renewal). */
  supersedeForItem(tenantId: string, complianceItemId: string): Promise<void>;

  /** List alerts for a supplier. */
  findBySupplierId(
    tenantId: string,
    supplierId: string,
    options?: { alertType?: ComplianceAlertType; activeOnly?: boolean }
  ): Promise<readonly ComplianceAlertLogEntry[]>;
}

// ─── Input DTOs ─────────────────────────────────────────────────────────────

export interface RenewComplianceItemInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly complianceItemId: string;
  readonly documentId: string;
  readonly newExpiryDate: Date;
  readonly notes?: string;
}

export interface CheckComplianceExpiryInput {
  readonly tenantId: string;
}

export interface GetComplianceAlertsInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly alertType?: ComplianceAlertType;
  readonly activeOnly?: boolean;
}

export interface GetComplianceTimelineInput {
  readonly tenantId: string;
  readonly supplierId: string;
}

// ─── Service Dependencies ───────────────────────────────────────────────────

export interface ComplianceServiceDeps {
  readonly supplierRepo: ISupplierRepo;
  readonly supplierComplianceRepo: ISupplierComplianceRepo;
  readonly complianceAlertLogRepo: IComplianceAlertLogRepo;
  readonly outboxWriter: IOutboxWriter;
  readonly proofChainWriter?: IProofChainWriter;
}

// ─── Proof Chain Helper ─────────────────────────────────────────────────────

async function writeProofEntry(
  writer: IProofChainWriter | undefined,
  input: {
    eventType: ProofEventType;
    entityId: string;
    actorId: string;
    actorType?: 'SUPPLIER' | 'BUYER' | 'SYSTEM';
    payload?: Record<string, unknown>;
  }
): Promise<string | null> {
  if (!writer) return null;
  const result = await writer.write(
    {
      eventId: crypto.randomUUID(),
      eventType: input.eventType,
      entityType: 'compliance_item',
      entityId: input.entityId,
      actorType: input.actorType ?? 'SUPPLIER',
      actorId: input.actorId,
      eventAt: new Date(),
      payload: input.payload ?? {},
      previousHash: null,
    },
    undefined
  );
  return result?.contentHash ?? null;
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Renew a compliance item — supplier uploads a new document and provides
 * a new expiry date. Supersedes existing alert log entries so the alert
 * cycle restarts from the new expiry date.
 */
export async function renewComplianceItem(
  input: RenewComplianceItemInput,
  deps: ComplianceServiceDeps
): Promise<Result<SupplierComplianceItem>> {
  // Verify supplier ownership
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.tenantId !== input.tenantId) {
    return err(new AppError('FORBIDDEN', 'Tenant mismatch'));
  }

  // Fetch compliance item
  const item = await deps.supplierComplianceRepo.findById(input.complianceItemId);
  if (!item) {
    return err(new AppError('NOT_FOUND', 'Compliance item not found'));
  }
  if (item.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Compliance item does not belong to this supplier'));
  }

  // Validate new expiry is in the future
  const now = new Date();
  if (input.newExpiryDate <= now) {
    return err(new AppError('VALIDATION_ERROR', 'New expiry date must be in the future'));
  }

  // Update compliance item with renewal
  const updatedItem = await deps.supplierComplianceRepo.upsert({
    ...item,
    documentId: input.documentId,
    expiryDate: input.newExpiryDate,
    issuedDate: now,
    notes: input.notes ?? item.notes,
    status: 'VALID',
    updatedAt: now,
  });

  // Supersede existing alerts so the cycle restarts
  await deps.complianceAlertLogRepo.supersedeForItem(input.tenantId, input.complianceItemId);

  // Write proof chain entry
  await writeProofEntry(deps.proofChainWriter, {
    eventType: 'COMPLIANCE_RENEWED',
    entityId: input.complianceItemId,
    actorId: input.userId,
    actorType: 'SUPPLIER',
    payload: {
      itemType: item.itemType,
      documentId: input.documentId,
      newExpiryDate: input.newExpiryDate.toISOString(),
    },
  });

  // Emit renewal event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_COMPLIANCE_RENEWED,
    payload: {
      entityId: input.complianceItemId,
      entityType: 'compliance_item',
      supplierId: input.supplierId,
      itemType: item.itemType,
      documentId: input.documentId,
      newExpiryDate: input.newExpiryDate.toISOString(),
    },
  });

  return ok(updatedItem);
}

/**
 * Batch compliance expiry scanner — intended to be called by a cron job.
 *
 * For each tenant's compliance items:
 * 1. Compute days until expiry
 * 2. Determine which alert threshold(s) have been reached
 * 3. Check alert log to avoid duplicate notifications
 * 4. For new alerts: write alert log entry + emit event
 * 5. For expired items: auto-create a case (via outbox event)
 *
 * Returns: number of alerts dispatched.
 */
export async function checkComplianceExpiry(
  input: CheckComplianceExpiryInput,
  deps: ComplianceServiceDeps
): Promise<Result<{ alertsDispatched: number; casesCreated: number }>> {
  // Fetch all compliance items with expiry dates for this tenant
  const items = await deps.supplierComplianceRepo.findExpiringByTenant(input.tenantId);

  let alertsDispatched = 0;
  let casesCreated = 0;

  for (const item of items) {
    const result = await processItemExpiry(item, deps);
    alertsDispatched += result.alertsSent;
    if (result.caseCreated) casesCreated++;
  }

  return ok({ alertsDispatched, casesCreated });
}

/**
 * Process a single compliance item for expiry alerts.
 * Called by the batch scanner for each item with an expiry date.
 *
 * Checks each threshold (30d, 14d, 7d, expired) and dispatches
 * notifications for any newly-reached thresholds.
 */
export async function processItemExpiry(
  item: SupplierComplianceItem,
  deps: ComplianceServiceDeps
): Promise<{ alertsSent: number; caseCreated: boolean }> {
  const now = new Date();
  let alertsSent = 0;
  let caseCreated = false;

  if (!item.expiryDate) return { alertsSent, caseCreated };

  const daysUntilExpiry = Math.floor(
    (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  for (const threshold of ALERT_THRESHOLDS) {
    // Only process if the threshold has been reached
    if (daysUntilExpiry > threshold.days) continue;

    // Check if this alert has already been sent
    const existingAlert = await deps.complianceAlertLogRepo.findActiveAlert(
      item.tenantId,
      item.id,
      threshold.type
    );
    if (existingAlert) continue;

    // Record the alert
    await deps.complianceAlertLogRepo.create({
      id: crypto.randomUUID(),
      tenantId: item.tenantId,
      complianceItemId: item.id,
      supplierId: item.supplierId,
      alertType: threshold.type,
      alertedAt: now,
      supersededAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // Emit notification event
    const eventType =
      threshold.type === 'EXPIRED'
        ? FinanceEventType.SUPPLIER_COMPLIANCE_EXPIRED
        : FinanceEventType.SUPPLIER_COMPLIANCE_EXPIRING;

    await deps.outboxWriter.write({
      tenantId: item.tenantId,
      eventType,
      payload: {
        entityId: item.id,
        entityType: 'compliance_item',
        supplierId: item.supplierId,
        itemType: item.itemType,
        alertType: threshold.type,
        daysUntilExpiry,
        expiryDate: item.expiryDate.toISOString(),
      },
    });

    alertsSent++;

    // Auto-create case for expired items
    if (threshold.type === 'EXPIRED') {
      await deps.outboxWriter.write({
        tenantId: item.tenantId,
        eventType: FinanceEventType.SUPPLIER_COMPLIANCE_CASE_CREATED,
        payload: {
          entityId: item.id,
          entityType: 'compliance_item',
          supplierId: item.supplierId,
          itemType: item.itemType,
          reason: `Compliance item "${item.itemType}" has expired and requires renewal`,
        },
      });
      caseCreated = true;
    }
  }

  return { alertsSent, caseCreated };
}

/**
 * Get compliance alert history for a supplier.
 */
export async function getComplianceAlerts(
  input: GetComplianceAlertsInput,
  deps: {
    supplierRepo: ISupplierRepo;
    complianceAlertLogRepo: IComplianceAlertLogRepo;
  }
): Promise<Result<readonly ComplianceAlertLogEntry[]>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.tenantId !== input.tenantId) {
    return err(new AppError('FORBIDDEN', 'Tenant mismatch'));
  }

  const alerts = await deps.complianceAlertLogRepo.findBySupplierId(
    input.tenantId,
    input.supplierId,
    { alertType: input.alertType, activeOnly: input.activeOnly }
  );

  return ok(alerts);
}

/**
 * Get compliance timeline (synthesized from alert log + compliance items).
 * Provides a chronological view of all compliance events for a supplier.
 */
export async function getComplianceTimeline(
  input: GetComplianceTimelineInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierComplianceRepo: ISupplierComplianceRepo;
    complianceAlertLogRepo: IComplianceAlertLogRepo;
  }
): Promise<Result<readonly ComplianceTimelineEntry[]>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.tenantId !== input.tenantId) {
    return err(new AppError('FORBIDDEN', 'Tenant mismatch'));
  }

  const items = await deps.supplierComplianceRepo.findBySupplierId(input.supplierId);
  const alerts = await deps.complianceAlertLogRepo.findBySupplierId(
    input.tenantId,
    input.supplierId
  );

  const timeline: ComplianceTimelineEntry[] = [];

  // Add item creation events
  for (const item of items) {
    timeline.push({
      id: crypto.randomUUID(),
      itemType: item.itemType,
      eventType: 'ITEM_CREATED',
      actorId: null,
      actorType: 'SYSTEM',
      details: {
        status: computeStatus(item, new Date()),
        expiryDate: item.expiryDate?.toISOString() ?? null,
      },
      createdAt: item.createdAt,
    });

    // Add verification event if verified
    if (item.lastVerifiedAt && item.lastVerifiedBy) {
      timeline.push({
        id: crypto.randomUUID(),
        itemType: item.itemType,
        eventType: 'VERIFIED',
        actorId: item.lastVerifiedBy,
        actorType: 'BUYER',
        details: {},
        createdAt: item.lastVerifiedAt,
      });
    }
  }

  // Add alert events
  for (const alert of alerts) {
    const item = items.find((i) => i.id === alert.complianceItemId);
    timeline.push({
      id: alert.id,
      itemType: item?.itemType ?? 'OTHER',
      eventType: alert.alertType === 'EXPIRED' ? 'EXPIRED' : 'ALERT_SENT',
      actorId: null,
      actorType: 'SYSTEM',
      details: {
        alertType: alert.alertType,
        superseded: !!alert.supersededAt,
      },
      createdAt: alert.alertedAt,
    });
  }

  // Sort chronologically (newest first)
  timeline.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return ok(timeline);
}
