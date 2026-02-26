// ─── Financial Instrument Types ──────────────────────────────────────────────

export type InstrumentCategory = 'fvtpl' | 'fvoci' | 'amortized_cost';
export type InstrumentType = 'equity' | 'debt' | 'derivative' | 'loan' | 'receivable';
export type InstrumentStatus = 'active' | 'matured' | 'sold' | 'impaired' | 'written_off';
export type FairValueLevel = 'level_1' | 'level_2' | 'level_3';

export interface FinancialInstrument {
  id: string;
  instrumentNumber: string;
  name: string;
  description: string;
  type: InstrumentType;
  category: InstrumentCategory;
  status: InstrumentStatus;
  issuer: string;
  currency: string;
  faceValue: number;
  carryingAmount: number;
  fairValue: number;
  fairValueLevel: FairValueLevel;
  unrealizedGainLoss: number;
  accruedInterest: number;
  interestRate: number | null;
  maturityDate: Date | null;
  acquisitionDate: Date;
  acquisitionCost: number;
  lastValuationDate: Date;
  ecl: number;
  eclStage: 1 | 2 | 3;
  glAccountId: string;
  glAccountCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FairValueMeasurement {
  id: string;
  instrumentId: string;
  valuationDate: Date;
  fairValue: number;
  level: FairValueLevel;
  valuationMethod: string;
  marketPrice: number | null;
  inputsUsed: string;
  valuedBy: string;
  journalEntryId: string | null;
}

export interface InstrumentSummary {
  totalInstruments: number;
  totalCarryingAmount: number;
  totalFairValue: number;
  unrealizedGainLoss: number;
  ecl: number;
  byCategory: Record<InstrumentCategory, number>;
}

export const instrumentCategoryLabels: Record<InstrumentCategory, string> = {
  fvtpl: 'FVTPL',
  fvoci: 'FVOCI',
  amortized_cost: 'Amortized Cost',
};

export const instrumentTypeLabels: Record<InstrumentType, string> = {
  equity: 'Equity',
  debt: 'Debt',
  derivative: 'Derivative',
  loan: 'Loan',
  receivable: 'Receivable',
};

export const instrumentStatusConfig: Record<InstrumentStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  matured: { label: 'Matured', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  sold: { label: 'Sold', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  impaired: { label: 'Impaired', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  written_off: { label: 'Written Off', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export const fairValueLevelLabels: Record<FairValueLevel, string> = {
  level_1: 'Level 1',
  level_2: 'Level 2',
  level_3: 'Level 3',
};
