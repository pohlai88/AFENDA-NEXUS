import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Context type ────────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

// ─── View Models ─────────────────────────────────────────────────────────────

export interface CustomerCreditView {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  utilizationPercent: number;
  overdueAmount: number;
  currency: string;
  paymentTermsDays: number;
  avgPaymentDays: number;
  riskRating: string;
  status: string;
  lastReviewDate: string;
  nextReviewDate: string;
  reviewFrequency: string;
  creditScoreExternal: number | null;
  creditScoreInternal: number | null;
  isOnHold: boolean;
  holdReason: string | null;
  holdDate: string | null;
  holdBy: string | null;
  approvedBy: string | null;
  approvedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditReviewView {
  id: string;
  reviewNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  reviewType: string;
  status: string;
  currentLimit: number;
  proposedLimit: number;
  currentRating: string;
  proposedRating: string;
  currency: string;
  requestedBy: string;
  requestedAt: string;
  assignedTo: string | null;
  financialAnalysis: string | null;
  paymentHistory: string | null;
  recommendation: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditHoldView {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  holdType: string;
  status: string;
  reason: string;
  amount: number;
  currency: string;
  blockedOrders: number;
  blockedOrderValue: number;
  holdDate: string;
  holdBy: string;
  releaseDate: string | null;
  releaseBy: string | null;
  releaseNotes: string | null;
  escalatedTo: string | null;
  escalatedAt: string | null;
  autoRelease: boolean;
  autoReleaseCondition: string | null;
}

export interface CreditSummaryView {
  totalCustomers: number;
  totalCreditLimit: number;
  totalOutstanding: number;
  totalOverdue: number;
  avgUtilization: number;
  customersOnHold: number;
  pendingReviews: number;
  overdueReviews: number;
  highRiskCustomers: number;
}

// ─── Customer Credit Queries ─────────────────────────────────────────────────

export const getCustomerCredits = cache(async (
  ctx: Ctx,
  params?: { status?: string; riskRating?: string; onHold?: boolean; search?: string },
): Promise<ApiResult<{ data: CustomerCreditView[] }>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.riskRating) query.riskRating = params.riskRating;
  if (params?.onHold !== undefined) query.onHold = String(params.onHold);
  if (params?.search) query.search = params.search;

  return client.get<{ data: CustomerCreditView[] }>('/credit-limits', query);
});

export const getCustomerCreditById = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<CustomerCreditView>> => {
  const client = createApiClient(ctx);
  return client.get<CustomerCreditView>(`/credit-limits/${id}`);
});

export async function setCreditLimit(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/credit-limits', body);
}

export async function updateRiskRating(
  ctx: Ctx,
  customerId: string,
  rating: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/credit-limits/${customerId}/risk-rating`, { rating, reason });
}

export async function recalculateInternalScore(
  ctx: Ctx,
  customerId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/credit-limits/${customerId}/recalculate`, {});
}

// ─── Credit Review Queries ───────────────────────────────────────────────────

export const getCreditReviews = cache(async (
  ctx: Ctx,
  params?: { status?: string; reviewType?: string },
): Promise<ApiResult<{ data: CreditReviewView[] }>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.reviewType) query.reviewType = params.reviewType;

  return client.get<{ data: CreditReviewView[] }>('/credit-reviews', query);
});

export const getCreditReviewById = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<CreditReviewView>> => {
  const client = createApiClient(ctx);
  return client.get<CreditReviewView>(`/credit-reviews/${id}`);
});

export async function createCreditReview(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/credit-reviews', body);
}

export async function updateCreditReview(
  ctx: Ctx,
  reviewId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/credit-reviews/${reviewId}`, body);
}

export async function approveCreditReview(
  ctx: Ctx,
  reviewId: string,
  body: { approvedLimit: number; approvedRating: string; notes?: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/credit-reviews/${reviewId}/approve`, body);
}

export async function rejectCreditReview(
  ctx: Ctx,
  reviewId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/credit-reviews/${reviewId}/reject`, { reason });
}

export async function escalateCreditReview(
  ctx: Ctx,
  reviewId: string,
  escalateTo: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/credit-reviews/${reviewId}/escalate`, { escalateTo, reason });
}

// ─── Credit Hold Queries ─────────────────────────────────────────────────────

export const getCreditHolds = cache(async (
  ctx: Ctx,
  params?: { status?: string; holdType?: string },
): Promise<ApiResult<{ data: CreditHoldView[] }>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.holdType) query.holdType = params.holdType;

  return client.get<{ data: CreditHoldView[] }>('/credit-holds', query);
});

export async function placeCreditHold(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/credit-holds', body);
}

export async function releaseCreditHold(
  ctx: Ctx,
  holdId: string,
  notes: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/credit-holds/${holdId}/release`, { notes });
}

export async function escalateCreditHold(
  ctx: Ctx,
  holdId: string,
  escalateTo: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/credit-holds/${holdId}/escalate`, { escalateTo, reason });
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export const getCreditSummary = cache(async (
  ctx: Ctx,
): Promise<ApiResult<CreditSummaryView>> => {
  const client = createApiClient(ctx);
  return client.get<CreditSummaryView>('/credit-limits/summary');
});

// ─── Audit ───────────────────────────────────────────────────────────────────

export const getCreditAudit = cache(async (
  ctx: Ctx,
  customerId: string,
): Promise<ApiResult<{ data: Array<{ id: string; action: string; userId: string; userName?: string; timestamp: string; details?: string }> }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: Array<{ id: string; action: string; userId: string; userName?: string; timestamp: string; details?: string }> }>(`/credit-limits/${customerId}/audit`);
});
