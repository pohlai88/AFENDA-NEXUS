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
  active: { label: 'Active', color: 'bg-success/15 text-success dark:bg-success/20' },
  matured: { label: 'Matured', color: 'bg-info/15 text-info dark:bg-info/20' },
  sold: { label: 'Sold', color: 'bg-accent text-accent-foreground' },
  impaired: { label: 'Impaired', color: 'bg-warning/15 text-warning dark:bg-warning/20' },
  written_off: {
    label: 'Written Off',
    color: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  },
};

export const fairValueLevelLabels: Record<FairValueLevel, string> = {
  level_1: 'Level 1',
  level_2: 'Level 2',
  level_3: 'Level 3',
};
