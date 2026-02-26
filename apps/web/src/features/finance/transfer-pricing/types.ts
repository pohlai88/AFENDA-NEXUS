// ─── Transfer Pricing Types ──────────────────────────────────────────────────

export type TransactionType =
  | 'goods'
  | 'services'
  | 'royalties'
  | 'interest'
  | 'cost_sharing'
  | 'other';
export type PricingMethod = 'cup' | 'resale_minus' | 'cost_plus' | 'tnmm' | 'profit_split';
export type PolicyStatus = 'active' | 'under_review' | 'expired' | 'draft';

export interface TransferPricingPolicy {
  id: string;
  policyNumber: string;
  name: string;
  description: string;
  transactionType: TransactionType;
  pricingMethod: PricingMethod;
  status: PolicyStatus;
  entities: string[];
  entityNames: string[];
  armLengthRange: { min: number; max: number };
  targetMargin: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  lastReviewDate: Date | null;
  nextReviewDate: Date | null;
  documentationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchmarkStudy {
  id: string;
  studyNumber: string;
  policyId: string;
  fiscalYear: number;
  transactionType: TransactionType;
  pricingMethod: PricingMethod;
  comparableSetSize: number;
  lowerQuartile: number;
  median: number;
  upperQuartile: number;
  interquartileRange: { min: number; max: number };
  actualResult: number;
  isWithinRange: boolean;
  studyProvider: string;
  studyDate: Date;
  documentationId: string | null;
}

export interface TransferPricingSummary {
  totalPolicies: number;
  activePolicies: number;
  policiesForReview: number;
  transactionsYTD: number;
  adjustmentsYTD: number;
  complianceRate: number;
}

export const transactionTypeLabels: Record<TransactionType, string> = {
  goods: 'Goods',
  services: 'Services',
  royalties: 'Royalties',
  interest: 'Interest',
  cost_sharing: 'Cost Sharing',
  other: 'Other',
};

export const pricingMethodLabels: Record<PricingMethod, string> = {
  cup: 'CUP',
  resale_minus: 'Resale Minus',
  cost_plus: 'Cost Plus',
  tnmm: 'TNMM',
  profit_split: 'Profit Split',
};

export const policyStatusConfig: Record<PolicyStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  under_review: { label: 'Under Review', color: 'bg-info/15 text-info dark:bg-info/20' },
  expired: { label: 'Expired', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
};
