'use server';

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

/* ── view models ────────────────────────────────────────── */

export interface DeferredTaxItemView {
  id: string;
  itemNumber: string;
  description: string;
  type: string;        // dta | dtl
  originType: string;  // fixed_assets, provisions, leases …
  status: string;      // active | reversed | utilized
  bookBasis: number;
  taxBasis: number;
  temporaryDifference: number;
  taxRate: number;
  deferredTaxAmount: number;
  currency: string;
  jurisdiction: string;
  originatingPeriod: string;
  expectedReversalPeriod: string | null;
  sourceId: string | null;
  sourceType: string | null;
  glAccountId: string;
  glAccountCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeferredTaxMovementView {
  id: string;
  itemId: string;
  periodEnd: string;
  openingBalance: number;
  additions: number;
  reversals: number;
  rateChange: number;
  fxAdjustment: number;
  closingBalance: number;
  journalEntryId: string | null;
}

export interface DeferredTaxSummaryView {
  totalDTA: number;
  totalDTL: number;
  netPosition: number;
  valuationAllowance: number;
  movementYTD: number;
  dtaByOrigin: Record<string, number>;
  dtlByOrigin: Record<string, number>;
}

/* ── queries ────────────────────────────────────────────── */

export const getDeferredTaxItems = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  params?: { type?: string; originType?: string; status?: string },
): Promise<ApiResult<PaginatedResponse<DeferredTaxItemView>>> => {
  const api = createApiClient(ctx);
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.originType) qs.set('originType', params.originType);
  if (params?.status) qs.set('status', params.status);
  const path = qs.toString() ? `/deferred-tax-items?${qs}` : '/deferred-tax-items';
  return api.get<PaginatedResponse<DeferredTaxItemView>>(path);
});

export const getDeferredTaxItemById = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  id: string,
): Promise<ApiResult<DeferredTaxItemView>> => {
  const api = createApiClient(ctx);
  return api.get<DeferredTaxItemView>(`/deferred-tax-items/${id}`);
});

export const getDeferredTaxSummary = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
): Promise<ApiResult<DeferredTaxSummaryView>> => {
  const api = createApiClient(ctx);
  return api.get<DeferredTaxSummaryView>('/deferred-tax-items/summary');
});

export const getDeferredTaxMovements = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  itemId: string,
): Promise<ApiResult<PaginatedResponse<DeferredTaxMovementView>>> => {
  const api = createApiClient(ctx);
  return api.get<PaginatedResponse<DeferredTaxMovementView>>(`/deferred-tax-items/${itemId}/movements`);
});

/* ── commands ───────────────────────────────────────────── */

export async function createDeferredTaxItemCmd(
  ctx: { userId: string; tenantId: string; token: string },
  input: unknown,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ id: string }>('/deferred-tax-items', input);
}

export async function recalculateDeferredTaxCmd(
  ctx: { userId: string; tenantId: string; token: string },
  periodEnd: string,
): Promise<ApiResult<{ itemsProcessed: number; journalId: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ itemsProcessed: number; journalId: string }>('/deferred-tax-items/recalculate', { periodEnd });
}

export async function applyRateChangeCmd(
  ctx: { userId: string; tenantId: string; token: string },
  newRate: number,
  effectiveDate: string,
): Promise<ApiResult<{ journalId: string; impact: number }>> {
  const api = createApiClient(ctx);
  return api.post<{ journalId: string; impact: number }>('/deferred-tax-items/rate-change', { newRate, effectiveDate });
}

export async function assessValuationAllowanceCmd(
  ctx: { userId: string; tenantId: string; token: string },
  dtaItemIds: string[],
  allowanceAmount: number,
): Promise<ApiResult<{ journalId: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ journalId: string }>('/deferred-tax-items/valuation-allowance', { dtaItemIds, allowanceAmount });
}
