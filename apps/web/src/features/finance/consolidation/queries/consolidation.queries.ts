'use server';

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

/* ── view models ────────────────────────────────────────── */

export interface GroupEntityView {
  id: string;
  entityCode: string;
  name: string;
  country: string;
  currency: string;
  entityType: string;
  consolidationMethod: string;
  status: string;
  parentId: string | null;
  ownershipPercent: number;
  votingRightsPercent: number;
  acquisitionDate: string | null;
  divestmentDate: string | null;
  functionalCurrency: string;
  reportingCurrency: string;
  fxRate: number;
  children?: GroupEntityView[];
}

export interface GoodwillAllocationView {
  id: string;
  entityId: string;
  entityName: string;
  acquisitionDate: string;
  initialGoodwill: number;
  accumulatedImpairment: number;
  carryingAmount: number;
  cguId: string;
  cguName: string;
  lastImpairmentTest: string;
  currency: string;
}

export interface OwnershipRecordView {
  id: string;
  entityId: string;
  effectiveDate: string;
  previousOwnership: number;
  newOwnership: number;
  changeType: string;
  consideration: number;
  nciAdjustment: number;
  goodwillImpact: number;
  journalEntryId: string | null;
}

export interface ConsolidationSummaryView {
  totalEntities: number;
  subsidiaries: number;
  associates: number;
  jointVentures: number;
  totalGoodwill: number;
  nciEquity: number;
  eliminationEntries: number;
}

/* ── queries ────────────────────────────────────────────── */

export const getGroupEntities = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
): Promise<ApiResult<PaginatedResponse<GroupEntityView>>> => {
  const api = createApiClient(ctx);
  return api.get<PaginatedResponse<GroupEntityView>>('/group-entities');
});

export const getGroupEntityById = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  id: string,
): Promise<ApiResult<GroupEntityView>> => {
  const api = createApiClient(ctx);
  return api.get<GroupEntityView>(`/group-entities/${id}`);
});

export const getGoodwillAllocations = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
): Promise<ApiResult<PaginatedResponse<GoodwillAllocationView>>> => {
  const api = createApiClient(ctx);
  return api.get<PaginatedResponse<GoodwillAllocationView>>('/goodwills');
});

export const getGoodwillById = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
  id: string,
): Promise<ApiResult<GoodwillAllocationView>> => {
  const api = createApiClient(ctx);
  return api.get<GoodwillAllocationView>(`/goodwills/${id}`);
});

export const getOwnershipRecords = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
): Promise<ApiResult<PaginatedResponse<OwnershipRecordView>>> => {
  const api = createApiClient(ctx);
  return api.get<PaginatedResponse<OwnershipRecordView>>('/ownership-records');
});

export const getConsolidationSummary = cache(async (
  ctx: { userId: string; tenantId: string; token: string },
): Promise<ApiResult<ConsolidationSummaryView>> => {
  const api = createApiClient(ctx);
  return api.get<ConsolidationSummaryView>('/group-entities/summary');
});

/* ── commands ───────────────────────────────────────────── */

export async function addGroupEntityCmd(
  ctx: { userId: string; tenantId: string; token: string },
  input: unknown,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ id: string }>('/group-entities', input);
}

export async function runConsolidationCmd(
  ctx: { userId: string; tenantId: string; token: string },
  input: unknown,
): Promise<ApiResult<{ journalEntries: number }>> {
  const api = createApiClient(ctx);
  return api.post<{ journalEntries: number }>('/consolidation', input);
}

export async function recordImpairmentCmd(
  ctx: { userId: string; tenantId: string; token: string },
  goodwillId: string,
  amount: number,
  reason: string,
): Promise<ApiResult<{ journalId: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ journalId: string }>(`/goodwills/${goodwillId}/impairment`, { amount, reason });
}

export async function createOwnershipRecordCmd(
  ctx: { userId: string; tenantId: string; token: string },
  input: unknown,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ id: string }>('/ownership-records', input);
}

export async function translateForeignSubCmd(
  ctx: { userId: string; tenantId: string; token: string },
  entityId: string,
  fxRate: number,
  periodEnd: string,
): Promise<ApiResult<{ ctaAmount: number; journalId: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ ctaAmount: number; journalId: string }>(`/group-entities/${entityId}/translate`, { fxRate, periodEnd });
}
