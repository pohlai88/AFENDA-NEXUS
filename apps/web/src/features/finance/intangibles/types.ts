// ─── Intangible Asset Types ─────────────────────────────────────────────────

export type IntangibleType = 'software' | 'patent' | 'trademark' | 'license' | 'goodwill' | 'development' | 'other';
export type IntangibleStatus = 'active' | 'fully_amortized' | 'impaired' | 'disposed' | 'written_off';
export type AmortizationMethod = 'straight_line' | 'declining_balance' | 'units_of_production';

export interface IntangibleCategory {
  id: string;
  code: string;
  name: string;
  intangibleType: IntangibleType;
  defaultAmortizationMethod: AmortizationMethod;
  defaultUsefulLifeMonths: number;
  assetAccountId: string;
  assetAccountCode: string;
  accumulatedAmortAccountId: string;
  accumulatedAmortAccountCode: string;
  amortizationExpenseAccountId: string;
  amortizationExpenseAccountCode: string;
  impairmentAccountId: string;
  impairmentAccountCode: string;
}

export interface IntangibleAsset {
  id: string;
  assetNumber: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  intangibleType: IntangibleType;
  status: IntangibleStatus;
  acquisitionDate: Date;
  amortizationStartDate: Date;
  originalCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  amortizationMethod: AmortizationMethod;
  currency: string;
  hasIndefiniteLife: boolean;
  isInternallyGenerated: boolean;
  developmentPhase: string | null;
  patentNumber: string | null;
  registrationNumber: string | null;
  expiryDate: Date | null;
  vendorId: string | null;
  vendorName: string | null;
  accumulatedAmortization: number;
  carryingAmount: number;
  impairmentLoss: number;
  lastAmortizationDate: Date | null;
  lastImpairmentTestDate: Date | null;
  nextImpairmentTestDate: Date | null;
  attachmentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Amortization Schedule ───────────────────────────────────────────────────

export interface AmortizationScheduleEntry {
  id: string;
  assetId: string;
  periodStart: Date;
  periodEnd: Date;
  periodName: string;
  amortizationAmount: number;
  accumulatedAmortization: number;
  carryingAmount: number;
  isPosted: boolean;
  journalId: string | null;
  journalNumber: string | null;
  postedDate: Date | null;
}

// ─── Impairment Test ─────────────────────────────────────────────────────────

export type ImpairmentTestResult = 'no_impairment' | 'impairment_recognized' | 'reversal';

export interface ImpairmentTest {
  id: string;
  assetId: string;
  testDate: Date;
  carryingAmountBefore: number;
  recoverableAmount: number;
  impairmentLoss: number;
  result: ImpairmentTestResult;
  methodology: string;
  assumptions: string;
  performedBy: string;
  journalId: string | null;
  journalNumber: string | null;
  createdAt: Date;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface IntangibleSummary {
  totalAssets: number;
  activeAssets: number;
  fullyAmortizedAssets: number;
  totalOriginalCost: number;
  totalAccumulatedAmortization: number;
  totalCarryingAmount: number;
  totalImpairmentLoss: number;
  monthlyAmortization: number;
  assetsRequiringImpairmentTest: number;
}

// ─── Status Config ───────────────────────────────────────────────────────────

export const intangibleStatusConfig: Record<IntangibleStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  fully_amortized: { label: 'Fully Amortized', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  impaired: { label: 'Impaired', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  disposed: { label: 'Disposed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  written_off: { label: 'Written Off', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export const intangibleTypeLabels: Record<IntangibleType, string> = {
  software: 'Software',
  patent: 'Patent',
  trademark: 'Trademark',
  license: 'License',
  goodwill: 'Goodwill',
  development: 'Development Costs',
  other: 'Other',
};

export const amortizationMethodLabels: Record<AmortizationMethod, string> = {
  straight_line: 'Straight Line',
  declining_balance: 'Declining Balance',
  units_of_production: 'Units of Production',
};

export const impairmentResultLabels: Record<ImpairmentTestResult, string> = {
  no_impairment: 'No Impairment',
  impairment_recognized: 'Impairment Recognized',
  reversal: 'Reversal of Prior Impairment',
};
