// ─── Cash Forecast Types ─────────────────────────────────────────────────────

export type ForecastPeriodType = 'daily' | 'weekly' | 'monthly';
export type ForecastStatus = 'draft' | 'published' | 'archived';

export interface CashForecast {
  id: string;
  name: string;
  description: string;
  periodType: ForecastPeriodType;
  startDate: Date;
  endDate: Date;
  currency: string;
  status: ForecastStatus;
  openingBalance: number;
  closingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashForecastPeriod {
  id: string;
  forecastId: string;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  inflows: CashFlowItem[];
  outflows: CashFlowItem[];
  totalInflows: number;
  totalOutflows: number;
  netFlow: number;
  closingBalance: number;
}

export interface CashFlowItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  isActual: boolean;
  confidence: 'high' | 'medium' | 'low';
  sourceType: string;
  sourceId?: string;
}

// ─── Covenant Types ──────────────────────────────────────────────────────────

export type CovenantType = 'financial' | 'reporting' | 'operational';
export type CovenantStatus = 'compliant' | 'at_risk' | 'breached' | 'waived';
export type ComparisonOperator = 'gte' | 'lte' | 'eq' | 'gt' | 'lt' | 'between';

export interface Covenant {
  id: string;
  name: string;
  description: string;
  type: CovenantType;
  facilityId: string;
  facilityName: string;
  lenderId: string;
  lenderName: string;
  metric: string;
  operator: ComparisonOperator;
  threshold: number;
  thresholdMax?: number;
  currentValue: number;
  status: CovenantStatus;
  testingFrequency: 'monthly' | 'quarterly' | 'annually';
  nextTestDate: Date;
  lastTestDate: Date | null;
  gracePeriodDays: number;
  consequences: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CovenantTest {
  id: string;
  covenantId: string;
  testDate: Date;
  periodEnd: Date;
  actualValue: number;
  threshold: number;
  variance: number;
  variancePercent: number;
  status: CovenantStatus;
  notes: string;
  testedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
}

// ─── Intercompany Loan Types ─────────────────────────────────────────────────

export type ICLoanStatus = 'active' | 'matured' | 'defaulted' | 'prepaid';
export type ICLoanType = 'term' | 'revolving' | 'demand';

export interface IntercompanyLoan {
  id: string;
  loanNumber: string;
  lenderEntityId: string;
  lenderEntityName: string;
  borrowerEntityId: string;
  borrowerEntityName: string;
  type: ICLoanType;
  principal: number;
  outstandingBalance: number;
  currency: string;
  interestRate: number;
  rateType: 'fixed' | 'floating';
  referenceRate?: string;
  spread?: number;
  startDate: Date;
  maturityDate: Date;
  accruedInterest: number;
  totalInterestPaid: number;
  status: ICLoanStatus;
  armLengthRate: number;
  isArmLength: boolean;
  transferPricingDocId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICLoanScheduleEntry {
  id: string;
  loanId: string;
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  principalPaid: number;
  interestPaid: number;
  paidDate: Date | null;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
}

// ─── Treasury Summary ────────────────────────────────────────────────────────

export interface TreasurySummary {
  totalCashPosition: number;
  forecastedEndOfMonth: number;
  activeLoans: number;
  totalLoanBalance: number;
  covenantsAtRisk: number;
  covenantsBreeched: number;
  upcomingMaturities: number;
  netIntercompanyPosition: number;
}

// ─── Status Configs ──────────────────────────────────────────────────────────

export const forecastStatusConfig: Record<ForecastStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  archived: { label: 'Archived', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
};

export const covenantStatusConfig: Record<CovenantStatus, { label: string; color: string }> = {
  compliant: { label: 'Compliant', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  at_risk: { label: 'At Risk', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  breached: { label: 'Breached', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  waived: { label: 'Waived', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};

export const covenantTypeLabels: Record<CovenantType, string> = {
  financial: 'Financial',
  reporting: 'Reporting',
  operational: 'Operational',
};

export const icLoanStatusConfig: Record<ICLoanStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  matured: { label: 'Matured', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  defaulted: { label: 'Defaulted', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  prepaid: { label: 'Prepaid', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};

export const icLoanTypeLabels: Record<ICLoanType, string> = {
  term: 'Term Loan',
  revolving: 'Revolving',
  demand: 'Demand Loan',
};
