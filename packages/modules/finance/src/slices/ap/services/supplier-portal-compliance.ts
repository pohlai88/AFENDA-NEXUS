import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ISupplierRepo } from '../ports/supplier-repo.js';

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
