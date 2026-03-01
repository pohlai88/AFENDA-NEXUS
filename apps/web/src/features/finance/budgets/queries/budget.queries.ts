import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export interface BudgetEntryListItem {
  id: string;
  accountId: string;
  accountCode: string;
  accountName?: string;
  periodId: string;
  periodName?: string;
  budgetAmount: string;
  version: number;
  versionNote?: string;
}

export interface BudgetVarianceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  budgetAmount: string;
  actualAmount: string;
  variance: string;
  variancePct: number;
}

export interface BudgetVarianceResult {
  ledgerId: string;
  periodId: string;
  rows: BudgetVarianceRow[];
  totalBudget: string;
  totalActual: string;
  totalVariance: string;
}

export interface VarianceAlert {
  accountCode: string;
  accountName: string;
  budgetAmount: string;
  actualAmount: string;
  variance: string;
  variancePct: number;
  severity: 'WARNING' | 'CRITICAL';
}

export interface VarianceAlertsResult {
  alerts: VarianceAlert[];
  ledgerId: string;
  periodId: string;
  warningPct: number;
  criticalPct: number;
}

// ─── Query Functions ────────────────────────────────────────────────────────

type RequestCtx = { tenantId: string; userId: string; token: string };

export const getBudgetEntries = cache(async (
  ctx: RequestCtx,
  params: { ledgerId: string; periodId: string; page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<BudgetEntryListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {
    ledgerId: params.ledgerId,
    periodId: params.periodId,
  };
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<BudgetEntryListItem>>('/budget-entries', query);
});

export const getBudgetVariance = cache(async (
  ctx: RequestCtx,
  params: { ledgerId: string; periodId: string }
): Promise<ApiResult<BudgetVarianceResult>> => {
  const client = createApiClient(ctx);
  return client.get<BudgetVarianceResult>('/reports/budget-variance', {
    ledgerId: params.ledgerId,
    periodId: params.periodId,
  });
});

export const getVarianceAlerts = cache(async (
  ctx: RequestCtx,
  params: { ledgerId: string; periodId: string; warningPct?: string; criticalPct?: string }
): Promise<ApiResult<VarianceAlertsResult>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {
    ledgerId: params.ledgerId,
    periodId: params.periodId,
  };
  if (params.warningPct) query.warningPct = params.warningPct;
  if (params.criticalPct) query.criticalPct = params.criticalPct;

  return client.get<VarianceAlertsResult>('/reports/variance-alerts', query);
});

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function upsertBudgetEntry(
  ctx: RequestCtx,
  body: unknown
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/budget-entries', body);
}
