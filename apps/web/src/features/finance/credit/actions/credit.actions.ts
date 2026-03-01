'use server';

import type {
  SetCreditLimitInput,
  CreateReviewInput,
  UpdateReviewInput,
  PlaceHoldInput,
} from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import {
  setCreditLimit as setCreditLimitQ,
  updateRiskRating as updateRiskRatingQ,
  recalculateInternalScore as recalculateScoreQ,
  createCreditReview as createReviewQ,
  updateCreditReview as updateReviewQ,
  approveCreditReview as approveReviewQ,
  rejectCreditReview as rejectReviewQ,
  escalateCreditReview as escalateReviewQ,
  placeCreditHold as placeHoldQ,
  releaseCreditHold as releaseHoldQ,
  escalateCreditHold as escalateHoldQ,
} from '../queries/credit.queries';

// ─── Credit Limit Actions ────────────────────────────────────────────────────

export async function setCreditLimitAction(
  input: SetCreditLimitInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await setCreditLimitQ(ctx, input);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function updateRiskRatingAction(
  customerId: string,
  rating: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await updateRiskRatingQ(ctx, customerId, rating, reason);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function recalculateInternalScoreAction(
  customerId: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await recalculateScoreQ(ctx, customerId);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

// ─── Credit Review Actions ───────────────────────────────────────────────────

export async function createCreditReviewAction(
  input: CreateReviewInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createReviewQ(ctx, input);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function assignReviewAction(
  reviewId: string,
  assignedTo: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = (await import('@/lib/api-client')).createApiClient(ctx);
  const result = await client.post<CommandReceipt>(`/credit-reviews/${reviewId}/assign`, { assignedTo });
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function updateCreditReviewAction(
  input: UpdateReviewInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await updateReviewQ(ctx, input.reviewId, input);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function approveCreditReviewAction(
  reviewId: string,
  approvedLimit: number,
  approvedRating: string,
  notes?: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await approveReviewQ(ctx, reviewId, { approvedLimit, approvedRating, notes });
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function rejectCreditReviewAction(
  reviewId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await rejectReviewQ(ctx, reviewId, reason);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function escalateCreditReviewAction(
  reviewId: string,
  escalateTo: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await escalateReviewQ(ctx, reviewId, escalateTo, reason);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

// ─── Credit Hold Actions ─────────────────────────────────────────────────────

export async function placeCreditHoldAction(
  input: PlaceHoldInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await placeHoldQ(ctx, input);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function releaseCreditHoldAction(
  holdId: string,
  notes: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await releaseHoldQ(ctx, holdId, notes);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function escalateCreditHoldAction(
  holdId: string,
  escalateTo: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await escalateHoldQ(ctx, holdId, escalateTo, reason);
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function releaseOrderFromHoldAction(
  holdId: string,
  orderId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = (await import('@/lib/api-client')).createApiClient(ctx);
  const result = await client.post<CommandReceipt>(`/credit-holds/${holdId}/release-order`, {
    orderId,
    reason,
  });
  if (result.ok) {
    revalidatePath(routes.finance.creditLimits);
    revalidatePath(routes.salesOrders);
  }
  return result;
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkRecalculateScoresAction(
  customerIds: string[],
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = (await import('@/lib/api-client')).createApiClient(ctx);
  const result = await client.post<CommandReceipt>('/credit-limits/bulk-recalculate', { customerIds });
  if (result.ok) revalidatePath(routes.finance.creditLimits);
  return result;
}

export async function generateCreditReportAction(
  asOfDate: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = (await import('@/lib/api-client')).createApiClient(ctx);
  return client.post<CommandReceipt>('/credit-limits/report', { asOfDate });
}
