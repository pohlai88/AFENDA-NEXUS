import { createApiClient } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';

// ─── Trial Balance View Models ──────────────────────────────────────────────

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  balance: string;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totalDebit: string;
  totalCredit: string;
  asOfDate: string;
}

// ─── Financial Report View Models ───────────────────────────────────────────

export interface ReportRow {
  accountCode: string;
  accountName: string;
  balance: string;
}

export interface ReportSection {
  label: string;
  rows: ReportRow[];
  total: string;
}

export interface BalanceSheetResult {
  ledgerId: string;
  periodId: string;
  assets: ReportSection;
  liabilities: ReportSection;
  equity: ReportSection;
  isBalanced: boolean;
  asOfDate: string;
}

export interface IncomeStatementResult {
  ledgerId: string;
  fromPeriodId: string;
  toPeriodId: string;
  revenue: ReportSection;
  expenses: ReportSection;
  netIncome: string;
  periodRange: string;
}

export interface CashFlowResult {
  ledgerId: string;
  fromPeriodId: string;
  toPeriodId: string;
  operatingActivities: string;
  investingActivities: string;
  financingActivities: string;
  netCashFlow: string;
  periodRange: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

export async function getTrialBalance(
  ctx: { tenantId: string; userId: string; token: string },
  params: { ledgerId: string; year: string; period?: string }
): Promise<ApiResult<TrialBalanceResult>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {
    ledgerId: params.ledgerId,
    year: params.year,
  };
  if (params.period) query.period = params.period;

  return client.get<TrialBalanceResult>('/trial-balance', query);
}

export async function getBalanceSheet(
  ctx: { tenantId: string; userId: string; token: string },
  params: { ledgerId: string; periodId: string }
): Promise<ApiResult<BalanceSheetResult>> {
  const client = createApiClient(ctx);
  return client.get<BalanceSheetResult>('/reports/balance-sheet', {
    ledgerId: params.ledgerId,
    periodId: params.periodId,
  });
}

export async function getIncomeStatement(
  ctx: { tenantId: string; userId: string; token: string },
  params: { ledgerId: string; fromPeriodId: string; toPeriodId: string }
): Promise<ApiResult<IncomeStatementResult>> {
  const client = createApiClient(ctx);
  return client.get<IncomeStatementResult>('/reports/income-statement', {
    ledgerId: params.ledgerId,
    fromPeriodId: params.fromPeriodId,
    toPeriodId: params.toPeriodId,
  });
}

export async function getCashFlow(
  ctx: { tenantId: string; userId: string; token: string },
  params: { ledgerId: string; fromPeriodId: string; toPeriodId: string }
): Promise<ApiResult<CashFlowResult>> {
  const client = createApiClient(ctx);
  return client.get<CashFlowResult>('/reports/cash-flow', {
    ledgerId: params.ledgerId,
    fromPeriodId: params.fromPeriodId,
    toPeriodId: params.toPeriodId,
  });
}
