'use server';

import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

/* ── view models ────────────────────────────────────────── */

export interface TransferPricingPolicyView {
  id: string;
  policyNumber: string;
  name: string;
  description: string;
  transactionType: string;
  pricingMethod: string;
  status: string;
  entities: string[];
  entityNames: string[];
  armLengthRange: { min: number; max: number };
  targetMargin: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  documentationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BenchmarkStudyView {
  id: string;
  studyNumber: string;
  policyId: string;
  fiscalYear: string;
  comparableSetSize: number;
  quartiles: { lq: number; median: number; uq: number };
  interquartileRange: number;
  actualResult: number;
  isWithinRange: boolean;
  studyProvider: string;
  studyDate: string;
  documentationId: string | null;
}

export interface TransferPricingSummaryView {
  totalPolicies: number;
  activePolicies: number;
  policiesForReview: number;
  transactionsYTD: number;
  adjustmentsYTD: number;
  complianceRate: number;
}

/* ── queries ────────────────────────────────────────────── */

export async function getTransferPricingPolicies(
  ctx: { userId: string; tenantId: string; token: string },
  params?: { status?: string; transactionType?: string },
): Promise<ApiResult<PaginatedResponse<TransferPricingPolicyView>>> {
  const api = createApiClient(ctx);
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.transactionType) qs.set('transactionType', params.transactionType);
  const path = qs.toString() ? `/tp-policies?${qs}` : '/tp-policies';
  return api.get<PaginatedResponse<TransferPricingPolicyView>>(path);
}

export async function getTransferPricingPolicyById(
  ctx: { userId: string; tenantId: string; token: string },
  id: string,
): Promise<ApiResult<TransferPricingPolicyView>> {
  const api = createApiClient(ctx);
  return api.get<TransferPricingPolicyView>(`/tp-policies/${id}`);
}

export async function getBenchmarkStudies(
  ctx: { userId: string; tenantId: string; token: string },
  policyId: string,
): Promise<ApiResult<PaginatedResponse<BenchmarkStudyView>>> {
  const api = createApiClient(ctx);
  return api.get<PaginatedResponse<BenchmarkStudyView>>(`/tp-policies/${policyId}/benchmarks`);
}

export async function getTransferPricingSummary(
  ctx: { userId: string; tenantId: string; token: string },
): Promise<ApiResult<TransferPricingSummaryView>> {
  const api = createApiClient(ctx);
  return api.get<TransferPricingSummaryView>('/tp-policies/summary');
}

/* ── commands ───────────────────────────────────────────── */

export async function createPolicyCmd(
  ctx: { userId: string; tenantId: string; token: string },
  input: unknown,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ id: string }>('/tp-policies', input);
}

export async function createBenchmarkCmd(
  ctx: { userId: string; tenantId: string; token: string },
  policyId: string,
  input: unknown,
): Promise<ApiResult<{ id: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ id: string }>(`/tp-policies/${policyId}/benchmarks`, input);
}

export async function recordAdjustmentCmd(
  ctx: { userId: string; tenantId: string; token: string },
  policyId: string,
  amount: number,
  reason: string,
): Promise<ApiResult<{ journalId: string }>> {
  const api = createApiClient(ctx);
  return api.post<{ journalId: string }>(`/tp-policies/${policyId}/adjustments`, { amount, reason });
}
