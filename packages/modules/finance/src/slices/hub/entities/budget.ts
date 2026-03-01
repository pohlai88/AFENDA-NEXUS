import type { CompanyId, LedgerId, Money } from '@afenda/core';

export interface BudgetEntry {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly ledgerId: LedgerId;
  readonly accountId: string;
  readonly accountCode: string;
  readonly periodId: string;
  readonly budgetAmount: Money;
  readonly version: number;
  readonly versionNote?: string;
  readonly createdAt: Date;
}

export interface BudgetVarianceRow {
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly budgetAmount: Money;
  readonly actualAmount: Money;
  readonly variance: Money;
}

export interface BudgetVarianceReport {
  readonly ledgerId: LedgerId;
  readonly periodId: string;
  readonly rows: readonly BudgetVarianceRow[];
  readonly totalBudget: Money;
  readonly totalActual: Money;
  readonly totalVariance: Money;
}
