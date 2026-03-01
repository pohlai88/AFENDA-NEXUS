import { createApiClient } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';

// ─── Aging View Models ─────────────────────────────────────────────────────

export interface AgingBucket {
  current: string;
  days30: string;
  days60: string;
  days90: string;
  over90: string;
  total: string;
}

export interface ApAgingRow extends AgingBucket {
  supplierId: string;
  supplierName: string;
  invoiceCount: number;
}

export interface ApAgingResult {
  asOfDate: string;
  rows: ApAgingRow[];
  totals: AgingBucket;
  currency: string;
}

export interface ArAgingRow extends AgingBucket {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  creditLimit: string;
}

export interface ArAgingResult {
  asOfDate: string;
  rows: ArAgingRow[];
  totals: AgingBucket;
  currency: string;
}

// ─── Asset Register View Models ─────────────────────────────────────────────

export interface AssetRegisterRow {
  assetId: string;
  assetCode: string;
  description: string;
  category: string;
  acquisitionDate: string;
  costAmount: string;
  accumulatedDepreciation: string;
  netBookValue: string;
  status: string;
}

export interface AssetRegisterResult {
  asOfDate: string;
  rows: AssetRegisterRow[];
  totalCost: string;
  totalDepreciation: string;
  totalNBV: string;
  currency: string;
}

// ─── Consolidation Report View Models ───────────────────────────────────────

export interface ConsolidationEntityRow {
  entityCode: string;
  entityName: string;
  currency: string;
  ownershipPercent: number;
  method: string;
  assets: string;
  liabilities: string;
  equity: string;
}

export interface ConsolidationReportResult {
  asOfDate: string;
  rows: ConsolidationEntityRow[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  eliminationsTotal: string;
  currency: string;
}

// ─── Cost Allocation View Models ────────────────────────────────────────────

export interface CostAllocationRow {
  costCenterCode: string;
  costCenterName: string;
  directCosts: string;
  allocatedCosts: string;
  totalCosts: string;
  allocationPercent: number;
}

export interface CostAllocationResult {
  periodRange: string;
  rows: CostAllocationRow[];
  totalDirectCosts: string;
  totalAllocatedCosts: string;
  grandTotal: string;
  currency: string;
}

// ─── Equity Statement View Models ───────────────────────────────────────────

export interface EquityMovementRow {
  description: string;
  shareCapital: string;
  retainedEarnings: string;
  otherReserves: string;
  nci: string;
  total: string;
}

export interface EquityStatementResult {
  periodRange: string;
  rows: EquityMovementRow[];
  openingBalance: EquityMovementRow;
  closingBalance: EquityMovementRow;
  currency: string;
}

// ─── Tax Summary View Models ────────────────────────────────────────────────

export interface TaxSummaryRow {
  taxCode: string;
  taxName: string;
  taxableBase: string;
  taxAmount: string;
  adjustments: string;
  netTax: string;
}

export interface TaxSummaryResult {
  periodRange: string;
  rows: TaxSummaryRow[];
  totalTaxableBase: string;
  totalTaxAmount: string;
  totalAdjustments: string;
  totalNetTax: string;
  currency: string;
}

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

// ─── Aging Queries ──────────────────────────────────────────────────────────

export async function getApAging(
  ctx: { tenantId: string; userId: string; token: string },
  params: { asOfDate?: string }
): Promise<ApiResult<ApAgingResult>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.asOfDate) query.asOfDate = params.asOfDate;
  return client.get<ApAgingResult>('/ap/aging', query);
}

export async function getArAging(
  ctx: { tenantId: string; userId: string; token: string },
  params: { asOfDate?: string }
): Promise<ApiResult<ArAgingResult>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.asOfDate) query.asOfDate = params.asOfDate;
  return client.get<ArAgingResult>('/ar/aging', query);
}

// ─── Asset Register Query ───────────────────────────────────────────────────

export async function getAssetRegister(
  ctx: { tenantId: string; userId: string; token: string },
  params: { asOfDate?: string }
): Promise<ApiResult<AssetRegisterResult>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.asOfDate) query.asOfDate = params.asOfDate;
  return client.get<AssetRegisterResult>('/reports/asset-register', query);
}

// ─── Consolidation Report Query ─────────────────────────────────────────────

export async function getConsolidationReport(
  ctx: { tenantId: string; userId: string; token: string },
  params: { periodId: string }
): Promise<ApiResult<ConsolidationReportResult>> {
  const client = createApiClient(ctx);
  return client.get<ConsolidationReportResult>('/reports/consolidation', {
    periodId: params.periodId,
  });
}

// ─── Cost Allocation Report Query ───────────────────────────────────────────

export async function getCostAllocationReport(
  ctx: { tenantId: string; userId: string; token: string },
  params: { fromPeriodId: string; toPeriodId: string }
): Promise<ApiResult<CostAllocationResult>> {
  const client = createApiClient(ctx);
  return client.get<CostAllocationResult>('/reports/cost-allocation', {
    fromPeriodId: params.fromPeriodId,
    toPeriodId: params.toPeriodId,
  });
}

// ─── Equity Statement Query ─────────────────────────────────────────────────

export async function getEquityStatement(
  ctx: { tenantId: string; userId: string; token: string },
  params: { ledgerId: string; fromPeriodId: string; toPeriodId: string }
): Promise<ApiResult<EquityStatementResult>> {
  const client = createApiClient(ctx);
  return client.get<EquityStatementResult>('/reports/equity-statement', {
    ledgerId: params.ledgerId,
    fromPeriodId: params.fromPeriodId,
    toPeriodId: params.toPeriodId,
  });
}

// ─── Tax Summary Query ──────────────────────────────────────────────────────

export async function getTaxSummary(
  ctx: { tenantId: string; userId: string; token: string },
  params: { fromPeriodId: string; toPeriodId: string }
): Promise<ApiResult<TaxSummaryResult>> {
  const client = createApiClient(ctx);
  return client.get<TaxSummaryResult>('/reports/tax-summary', {
    fromPeriodId: params.fromPeriodId,
    toPeriodId: params.toPeriodId,
  });
}
