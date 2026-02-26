// ─── Lease Contract Types ────────────────────────────────────────────────────

export type LeaseType = 'finance' | 'operating' | 'short_term' | 'low_value';
export type LeaseStatus = 'draft' | 'active' | 'modified' | 'terminated' | 'expired';
export type AssetClass = 'property' | 'vehicle' | 'equipment' | 'it_equipment' | 'other';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi_annually' | 'annually';

export interface LeaseContract {
  id: string;
  leaseNumber: string;
  description: string;
  lessorName: string;
  lessorId: string;
  assetClass: AssetClass;
  assetDescription: string;
  leaseType: LeaseType;
  status: LeaseStatus;
  commencementDate: Date;
  endDate: Date;
  leaseTerm: number;
  paymentAmount: number;
  paymentFrequency: PaymentFrequency;
  currency: string;
  incrementalBorrowingRate: number;
  rouAssetValue: number;
  leaseLiabilityValue: number;
  accumulatedDepreciation: number;
  carryingAmount: number;
  currentLiability: number;
  nonCurrentLiability: number;
  hasExtensionOption: boolean;
  extensionPeriod: number | null;
  hasTerminationOption: boolean;
  terminationPenalty: number | null;
  hasPurchaseOption: boolean;
  purchasePrice: number | null;
  isReasonablyCertainToExtend: boolean;
  isReasonablyCertainToPurchase: boolean;
  costCenterId: string | null;
  costCenterCode: string | null;
  glAccountAsset: string;
  glAccountLiability: string;
  glAccountInterest: string;
  glAccountDepreciation: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── ROU Asset Types ─────────────────────────────────────────────────────────

export interface ROUAsset {
  id: string;
  leaseId: string;
  leaseNumber: string;
  assetNumber: string;
  description: string;
  assetClass: AssetClass;
  commencementDate: Date;
  initialValue: number;
  accumulatedDepreciation: number;
  carryingAmount: number;
  monthlyDepreciation: number;
  usefulLife: number;
  currency: string;
  impairmentLoss: number;
  isImpaired: boolean;
}

// ─── Lease Liability Schedule ────────────────────────────────────────────────

export interface LeaseScheduleEntry {
  id: string;
  leaseId: string;
  periodNumber: number;
  dueDate: Date;
  openingBalance: number;
  payment: number;
  interestExpense: number;
  principalReduction: number;
  closingBalance: number;
  isPaid: boolean;
  paidDate: Date | null;
  actualPayment: number | null;
}

// ─── Lease Modification Types ────────────────────────────────────────────────

export type ModificationType =
  | 'scope_increase'
  | 'scope_decrease'
  | 'term_extension'
  | 'term_reduction'
  | 'payment_change'
  | 'reassessment';

export interface LeaseModification {
  id: string;
  leaseId: string;
  modificationNumber: string;
  effectiveDate: Date;
  modificationType: ModificationType;
  description: string;
  revisedPaymentAmount: number | null;
  revisedEndDate: Date | null;
  revisedIBR: number | null;
  rouAdjustment: number;
  liabilityAdjustment: number;
  gainOrLoss: number;
  processedAt: Date | null;
  processedBy: string | null;
  journalEntryId: string | null;
}

// ─── Lease Summary ───────────────────────────────────────────────────────────

export interface LeaseSummary {
  totalLeases: number;
  activeLeases: number;
  totalROUAssets: number;
  totalLeaseLiability: number;
  currentLiability: number;
  nonCurrentLiability: number;
  monthlyPaymentsDue: number;
  leasesExpiringSoon: number;
  pendingModifications: number;
}

// ─── Status Configs ──────────────────────────────────────────────────────────

export const leaseStatusConfig: Record<LeaseStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  modified: { label: 'Modified', color: 'bg-info/15 text-info dark:bg-info/20' },
  terminated: {
    label: 'Terminated',
    color: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  },
  expired: { label: 'Expired', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
};

export const leaseTypeLabels: Record<LeaseType, string> = {
  finance: 'Finance Lease',
  operating: 'Operating Lease',
  short_term: 'Short-Term',
  low_value: 'Low Value',
};

export const assetClassLabels: Record<AssetClass, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  equipment: 'Equipment',
  it_equipment: 'IT Equipment',
  other: 'Other',
};

export const modificationTypeLabels: Record<ModificationType, string> = {
  scope_increase: 'Scope Increase',
  scope_decrease: 'Scope Decrease',
  term_extension: 'Term Extension',
  term_reduction: 'Term Reduction',
  payment_change: 'Payment Change',
  reassessment: 'Reassessment',
};

export const paymentFrequencyLabels: Record<PaymentFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annually: 'Semi-Annually',
  annually: 'Annually',
};
