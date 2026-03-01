import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';

// ─── Context type ────────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

// ─── Payment Terms View Models ───────────────────────────────────────────────

export interface PaymentTermsListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  dueDays: number;
  discountDays: number | null;
  discountPercent: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface PaymentTermsDetail extends PaymentTermsListItem {
  lines: PaymentTermsLineView[];
  updatedAt: string;
}

export interface PaymentTermsLineView {
  id: string;
  sequence: number;
  duePercent: number;
  dueDays: number;
  discountDays: number | null;
  discountPercent: number | null;
}

// ─── Match Tolerance View Models ─────────────────────────────────────────────

export interface MatchToleranceListItem {
  id: string;
  scope: string;
  scopeEntityId: string | null;
  companyId: string | null;
  toleranceBps: number;
  quantityTolerancePercent: number;
  autoHold: boolean;
  isActive: boolean;
  createdAt: string;
}

// ─── Payment Terms Queries ───────────────────────────────────────────────────

export const getPaymentTerms = cache(async (
  ctx: Ctx,
  params: { page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<PaymentTermsListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<PaymentTermsListItem>>('/payment-terms', query);
});

export const getPaymentTermsById = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<PaymentTermsDetail>> => {
  const client = createApiClient(ctx);
  return client.get<PaymentTermsDetail>(`/payment-terms/${id}`);
});

// ─── Match Tolerance Queries ─────────────────────────────────────────────────

export const getMatchTolerances = cache(async (
  ctx: Ctx,
  params: { page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<MatchToleranceListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<MatchToleranceListItem>>('/match-tolerances', query);
});

// ─── Command Functions ───────────────────────────────────────────────────────

export async function createMatchTolerance(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/match-tolerances', body);
}

export async function updateMatchTolerance(
  ctx: Ctx,
  id: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/match-tolerances/${id}`, body);
}
