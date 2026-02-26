'use server';

import type {
  SetCreditLimitInput,
  CreateReviewInput,
  UpdateReviewInput,
  PlaceHoldInput,
} from '@afenda/contracts';
import type { RiskRating } from '../types';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';

// ─── Credit Limit Actions ────────────────────────────────────────────────────

export async function setCreditLimit(
  input: SetCreditLimitInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] setCreditLimit:', input);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function updateRiskRating(
  customerId: string,
  rating: RiskRating,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] updateRiskRating:', customerId, rating, reason);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function recalculateInternalScore(
  customerId: string
): Promise<{ ok: true; newScore: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));
  console.log('[Action] recalculateInternalScore:', customerId);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true, newScore: 78 };
}

// ─── Credit Review Actions ───────────────────────────────────────────────────

export async function createCreditReview(
  input: CreateReviewInput
): Promise<{ ok: true; reviewId: string; reviewNumber: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] createCreditReview:', input);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true, reviewId: 'rev-new-' + Date.now(), reviewNumber: 'CR-2026-' + Date.now() };
}

export async function assignReview(
  reviewId: string,
  assignedTo: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 250));
  console.log('[Action] assignReview:', reviewId, assignedTo);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function updateCreditReview(
  input: UpdateReviewInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] updateCreditReview:', input);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function approveCreditReview(
  reviewId: string,
  approvedLimit: number,
  approvedRating: RiskRating,
  notes?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] approveCreditReview:', reviewId, approvedLimit, approvedRating);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function rejectCreditReview(
  reviewId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] rejectCreditReview:', reviewId, reason);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function escalateCreditReview(
  reviewId: string,
  escalateTo: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] escalateCreditReview:', reviewId, escalateTo, reason);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

// ─── Credit Hold Actions ─────────────────────────────────────────────────────

export async function placeCreditHold(
  input: PlaceHoldInput
): Promise<{ ok: true; holdId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 400));
  console.log('[Action] placeCreditHold:', input);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true, holdId: 'hold-new-' + Date.now() };
}

export async function releaseCreditHold(
  holdId: string,
  notes: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));
  console.log('[Action] releaseCreditHold:', holdId, notes);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function escalateCreditHold(
  holdId: string,
  escalateTo: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] escalateCreditHold:', holdId, escalateTo, reason);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true };
}

export async function releaseOrderFromHold(
  holdId: string,
  orderId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));
  console.log('[Action] releaseOrderFromHold:', holdId, orderId, reason);
  revalidatePath(routes.finance.creditLimits);
  revalidatePath('/sales/orders');
  return { ok: true };
}

// ─── Bulk Actions ────────────────────────────────────────────────────────────

export async function bulkRecalculateScores(
  customerIds: string[]
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 800));
  console.log('[Action] bulkRecalculateScores:', customerIds);
  revalidatePath(routes.finance.creditLimits);
  return { ok: true, updated: customerIds.length };
}

export async function generateCreditReport(
  asOfDate: Date
): Promise<{ ok: true; reportId: string } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 600));
  console.log('[Action] generateCreditReport:', asOfDate);
  return { ok: true, reportId: 'rpt-credit-' + Date.now() };
}
