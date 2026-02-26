// ─── Hedge Accounting Types ──────────────────────────────────────────────────

export type HedgeType = 'fair_value' | 'cash_flow' | 'net_investment';
export type HedgeStatus = 'active' | 'discontinued' | 'terminated';
export type EffectivenessResult = 'effective' | 'partially_effective' | 'ineffective';

export interface HedgeRelationship {
  id: string;
  relationshipNumber: string;
  name: string;
  description: string;
  hedgeType: HedgeType;
  status: HedgeStatus;
  hedgedItemId: string;
  hedgedItemDescription: string;
  hedgingInstrumentId: string;
  hedgingInstrumentDescription: string;
  hedgeRatio: number;
  designationDate: Date;
  terminationDate: Date | null;
  currency: string;
  hedgedRisk: string;
  lastEffectivenessTest: Date | null;
  effectivenessResult: EffectivenessResult | null;
  ineffectivenessAmount: number;
  cashFlowReserve: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EffectivenessTest {
  id: string;
  relationshipId: string;
  testDate: Date;
  periodEnd: Date;
  method: 'dollar_offset' | 'regression' | 'hypothetical_derivative';
  hedgedItemChange: number;
  hedgingInstrumentChange: number;
  effectivenessRatio: number;
  result: EffectivenessResult;
  ineffectivenessAmount: number;
  journalEntryId: string | null;
  testedBy: string;
  createdAt: Date;
}

export interface HedgingSummary {
  totalRelationships: number;
  activeRelationships: number;
  cashFlowReserveBalance: number;
  totalIneffectiveness: number;
  upcomingTests: number;
  ineffectiveRelationships: number;
}

export const hedgeTypeLabels: Record<HedgeType, string> = {
  fair_value: 'Fair Value Hedge',
  cash_flow: 'Cash Flow Hedge',
  net_investment: 'Net Investment Hedge',
};

export const hedgeStatusConfig: Record<HedgeStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  discontinued: { label: 'Discontinued', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  terminated: { label: 'Terminated', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export const effectivenessResultConfig: Record<EffectivenessResult, { label: string; color: string }> = {
  effective: { label: 'Effective', color: 'bg-green-100 text-green-800' },
  partially_effective: { label: 'Partially Effective', color: 'bg-amber-100 text-amber-800' },
  ineffective: { label: 'Ineffective', color: 'bg-red-100 text-red-800' },
};
