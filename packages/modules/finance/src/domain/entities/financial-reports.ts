import type { LedgerId, Money } from "@afenda/core";

export interface ReportSection {
  readonly label: string;
  readonly rows: readonly ReportRow[];
  readonly total: Money;
}

export interface ReportRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly balance: Money;
}

export interface BalanceSheet {
  readonly ledgerId: LedgerId;
  readonly periodId: string;
  readonly assets: ReportSection;
  readonly liabilities: ReportSection;
  readonly equity: ReportSection;
  readonly isBalanced: boolean;
}

export interface IncomeStatement {
  readonly ledgerId: LedgerId;
  readonly fromPeriodId: string;
  readonly toPeriodId: string;
  readonly revenue: ReportSection;
  readonly expenses: ReportSection;
  readonly netIncome: Money;
}

export interface ComparativeReportRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly currentBalance: Money;
  readonly priorBalance: Money;
  readonly variance: Money;
  readonly variancePercent: number | null;
}

export interface ComparativeReportSection {
  readonly label: string;
  readonly rows: readonly ComparativeReportRow[];
  readonly currentTotal: Money;
  readonly priorTotal: Money;
  readonly varianceTotal: Money;
}

export interface ComparativeBalanceSheet {
  readonly ledgerId: LedgerId;
  readonly currentPeriodId: string;
  readonly priorPeriodId: string;
  readonly assets: ComparativeReportSection;
  readonly liabilities: ComparativeReportSection;
  readonly equity: ComparativeReportSection;
  readonly isBalanced: boolean;
}

export interface ComparativeIncomeStatement {
  readonly ledgerId: LedgerId;
  readonly currentFromPeriodId: string;
  readonly currentToPeriodId: string;
  readonly priorFromPeriodId: string;
  readonly priorToPeriodId: string;
  readonly revenue: ComparativeReportSection;
  readonly expenses: ComparativeReportSection;
  readonly currentNetIncome: Money;
  readonly priorNetIncome: Money;
  readonly netIncomeVariance: Money;
}

export interface CashFlowStatement {
  readonly ledgerId: LedgerId;
  readonly fromPeriodId: string;
  readonly toPeriodId: string;
  readonly operatingActivities: Money;
  readonly investingActivities: Money;
  readonly financingActivities: Money;
  readonly netCashFlow: Money;
}
