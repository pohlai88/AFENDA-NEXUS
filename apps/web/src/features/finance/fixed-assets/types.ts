// ─── Asset Types ─────────────────────────────────────────────────────────────

export type AssetStatus = 'active' | 'fully_depreciated' | 'disposed' | 'written_off' | 'held_for_sale';
export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production';
export type AssetDisposalType = 'sale' | 'scrap' | 'theft' | 'donation' | 'transfer';

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultDepreciationMethod: DepreciationMethod;
  defaultUsefulLifeMonths: number;
  defaultSalvagePercent: number;
  assetAccountId: string;
  assetAccountCode: string;
  accumulatedDepAccountId: string;
  accumulatedDepAccountCode: string;
  depreciationExpenseAccountId: string;
  depreciationExpenseAccountCode: string;
  gainLossAccountId: string;
  gainLossAccountCode: string;
}

export interface FixedAsset {
  id: string;
  assetNumber: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: AssetStatus;
  acquisitionDate: Date;
  inServiceDate: Date;
  originalCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: DepreciationMethod;
  currency: string;
  location: string;
  department: string;
  responsiblePerson: string;
  serialNumber: string | null;
  barcode: string | null;
  purchaseOrderId: string | null;
  purchaseOrderNumber: string | null;
  vendorId: string | null;
  vendorName: string | null;
  warrantyExpiryDate: Date | null;
  accumulatedDepreciation: number;
  netBookValue: number;
  lastDepreciationDate: Date | null;
  disposalDate: Date | null;
  disposalType: AssetDisposalType | null;
  disposalProceeds: number | null;
  disposalGainLoss: number | null;
  attachmentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Depreciation Schedule ───────────────────────────────────────────────────

export interface DepreciationScheduleEntry {
  id: string;
  assetId: string;
  periodStart: Date;
  periodEnd: Date;
  periodName: string;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  isPosted: boolean;
  journalId: string | null;
  journalNumber: string | null;
  postedDate: Date | null;
}

// ─── Depreciation Run ────────────────────────────────────────────────────────

export type DepreciationRunStatus = 'draft' | 'calculated' | 'posted' | 'cancelled';

export interface DepreciationRun {
  id: string;
  runNumber: string;
  periodStart: Date;
  periodEnd: Date;
  periodName: string;
  status: DepreciationRunStatus;
  assetCount: number;
  totalDepreciation: number;
  currency: string;
  journalId: string | null;
  journalNumber: string | null;
  calculatedAt: Date;
  calculatedBy: string;
  postedAt: Date | null;
  postedBy: string | null;
}

// ─── Asset Summary ───────────────────────────────────────────────────────────

export interface AssetSummary {
  totalAssets: number;
  activeAssets: number;
  fullyDepreciatedAssets: number;
  disposedThisYear: number;
  totalOriginalCost: number;
  totalAccumulatedDepreciation: number;
  totalNetBookValue: number;
  monthlyDepreciation: number;
  pendingDisposals: number;
}

// ─── Disposal Request ────────────────────────────────────────────────────────

export type DisposalRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed';

export interface DisposalRequest {
  id: string;
  requestNumber: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  disposalType: AssetDisposalType;
  requestedDate: Date;
  expectedProceeds: number;
  reason: string;
  status: DisposalRequestStatus;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  completedAt: Date | null;
}

// ─── Status Config ───────────────────────────────────────────────────────────

export const assetStatusConfig: Record<AssetStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  fully_depreciated: { label: 'Fully Depreciated', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  disposed: { label: 'Disposed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  written_off: { label: 'Written Off', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  held_for_sale: { label: 'Held for Sale', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

export const depreciationMethodLabels: Record<DepreciationMethod, string> = {
  straight_line: 'Straight Line',
  declining_balance: 'Declining Balance',
  sum_of_years: 'Sum of Years Digits',
  units_of_production: 'Units of Production',
};

export const disposalTypeLabels: Record<AssetDisposalType, string> = {
  sale: 'Sale',
  scrap: 'Scrap',
  theft: 'Theft/Loss',
  donation: 'Donation',
  transfer: 'Transfer',
};

export const depRunStatusConfig: Record<DepreciationRunStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  calculated: { label: 'Calculated', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  posted: { label: 'Posted', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};
