// ─── Asset Types ─────────────────────────────────────────────────────────────

export type AssetStatus =
  | 'active'
  | 'fully_depreciated'
  | 'disposed'
  | 'written_off'
  | 'held_for_sale';
export type DepreciationMethod =
  | 'straight_line'
  | 'declining_balance'
  | 'sum_of_years'
  | 'units_of_production';
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

export type DisposalRequestStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed';

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
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  fully_depreciated: { label: 'Fully Depreciated', color: 'bg-info/15 text-info dark:bg-info/20' },
  disposed: { label: 'Disposed', color: 'bg-muted text-muted-foreground' },
  written_off: {
    label: 'Written Off',
    color: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  },
  held_for_sale: { label: 'Held for Sale', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
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
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  calculated: { label: 'Calculated', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
  posted: { label: 'Posted', color: 'bg-success/15 text-success dark:bg-success/20' },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  },
};
