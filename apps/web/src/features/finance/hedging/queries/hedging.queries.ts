'use server';

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

/* ── view models ────────────────────────────────────────── */

export interface HedgeRelationshipView {
  id: string;
  relationshipNumber: string;
  name: string;
  description: string;
  hedgeType: string;
  status: string;
  hedgedItemId: string;
  hedgedItemDescription: string;
  hedgingInstrumentId: string;
  hedgingInstrumentDescription: string;
  hedgeRatio: number;
  designationDate: string;
  terminationDate: string | null;
  currency: string;
  hedgedRisk: string;
  lastEffectivenessTest: string | null;
  effectivenessResult: string | null;
  ineffectivenessAmount: number;
  cashFlowReserve: number;
  createdAt: string;
  updatedAt: string;
}

export interface EffectivenessTestView {
  id: string;
  relationshipId: string;
  testDate: string;
  periodEnd: string;
  method: string;
  hedgedItemChange: number;
  hedgingInstrumentChange: number;
  effectivenessRatio: number;
  result: string;
  ineffectivenessAmount: number;
  journalEntryId: string | null;
  testedBy: string;
  createdAt: string;
}

export interface HedgingSummaryView {
  activeRelationships: number;
  fairValueHedges: number;
  cashFlowHedges: number;
  netInvestmentHedges: number;
  totalCashFlowReserve: number;
  totalIneffectiveness: number;
}

/* ── queries ────────────────────────────────────────────── */

export const getHedgeRelationships = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  params?: { status?: string; hedgeType?: string },
): Promise<ApiResult<PaginatedResponse<HedgeRelationshipView>>> => {
  const api = createApiClient(ctx);
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.hedgeType) qs.set('hedgeType', params.hedgeType);
  const path = qs.toString() ? `/hedge-relationships?${qs}` : '/hedge-relationships';
  return api.get<PaginatedResponse<HedgeRelationshipView>>(path);
});

export const getHedgeRelationshipById = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  id: string,
): Promise<ApiResult<HedgeRelationshipView>> => {
  const api = createApiClient(ctx);
  return api.get<HedgeRelationshipView>(`/hedge-relationships/${id}`);
});

export const getEffectivenessTests = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  relationshipId: string,
): Promise<ApiResult<PaginatedResponse<EffectivenessTestView>>> => {
  const api = createApiClient(ctx);
  return api.get<PaginatedResponse<EffectivenessTestView>>(`/hedge-relationships/${relationshipId}/effectiveness-tests`);
});

export const getHedgingSummary = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
): Promise<ApiResult<HedgingSummaryView>> => {
  const api = createApiClient(ctx);
  return api.get<HedgingSummaryView>('/hedge-relationships/summary');
});

/* ── commands ───────────────────────────────────────────── */

export async function designateHedgeCmd(
  ctx: { userId: string; tenantId: string; token: string },
  input: unknown,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ id: string }>('/hedge-relationships', input);
}

export async function runEffectivenessTestCmd(
  ctx: { userId: string; tenantId: string; token: string },
  relationshipId: string,
  input: unknown,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ id: string }>(`/hedge-relationships/${relationshipId}/effectiveness-tests`, input);
}

export async function discontinueHedgeCmd(
  ctx: { userId: string; tenantId: string; token: string },
  relationshipId: string,
  reason: string,
): Promise<ApiResult<{ journalId: string }>> {
  const api = createApiClient(ctx);
  return api.patch<{ journalId: string }>(`/hedge-relationships/${relationshipId}/status`, { status: 'DISCONTINUED', reason });
}

export async function recycleCashFlowReserveCmd(
  ctx: { userId: string; tenantId: string; token: string },
  relationshipId: string,
  amount: number,
): Promise<ApiResult<{ journalId: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ journalId: string }>(`/hedge-relationships/${relationshipId}/recycle`, { amount });
}
