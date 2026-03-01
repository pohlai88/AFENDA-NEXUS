'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { CommandReceipt, ApiResult } from '@/lib/types';
import { routes } from '@/lib/constants';

// ─── Submit Claim (real API) ─────────────────────────────────────────────────

export async function submitExpenseClaimAction(
  claimId: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>(`/expense-claims/${claimId}/submit`, {});

  if (result.ok) {
    revalidatePath(routes.finance.expenses);
    revalidatePath(routes.finance.expenseDetail(claimId));
    revalidatePath(routes.finance.approvals);
  }

  return result;
}

// ─── Approve Claim ───────────────────────────────────────────────────────────
// Backend endpoint pending — stub targets POST /expense-claims/:id/approve

export async function approveExpenseClaimAction(params: {
  id: string;
  approvedAmount?: number;
  comments?: string;
}): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>(`/expense-claims/${params.id}/approve`, {
    approvedAmount: params.approvedAmount,
    comments: params.comments,
  });

  if (result.ok) {
    revalidatePath(routes.finance.expenses);
    revalidatePath(routes.finance.expenseDetail(params.id));
    revalidatePath(routes.finance.approvals);
  }

  return result;
}

// ─── Reject Claim ────────────────────────────────────────────────────────────

export async function rejectExpenseClaimAction(params: {
  id: string;
  reason: string;
}): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>(`/expense-claims/${params.id}/reject`, {
    reason: params.reason,
  });

  if (result.ok) {
    revalidatePath(routes.finance.expenses);
    revalidatePath(routes.finance.expenseDetail(params.id));
    revalidatePath(routes.finance.approvals);
  }

  return result;
}

// ─── Cancel Claim ────────────────────────────────────────────────────────────

export async function cancelExpenseClaimAction(
  claimId: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>(`/expense-claims/${claimId}/cancel`, {});

  if (result.ok) {
    revalidatePath(routes.finance.expenses);
    revalidatePath(routes.finance.expenseDetail(claimId));
  }

  return result;
}

// ─── Create Claim ────────────────────────────────────────────────────────────
// Backend endpoint pending — stub targets POST /expense-claims

export async function createExpenseClaimAction(
  data: {
    title: string;
    description?: string;
    currency: string;
    periodFrom: string;
    periodTo: string;
  },
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>('/expense-claims', data);

  if (result.ok) {
    revalidatePath(routes.finance.expenses);
  }

  return result;
}

// ─── Add Line Item ───────────────────────────────────────────────────────────
// Backend endpoint pending — stub targets POST /expense-claims/:id/lines

export async function addExpenseLineItemAction(
  claimId: string,
  data: {
    expenseDate: string;
    category: string;
    description: string;
    merchantName: string;
    amount: number;
    currency: string;
    glAccountId: string;
    costCenterId?: string;
  },
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>(`/expense-claims/${claimId}/lines`, data);

  if (result.ok) {
    revalidatePath(routes.finance.expenseDetail(claimId));
  }

  return result;
}

// ─── Bulk Approve ────────────────────────────────────────────────────────────

export async function bulkApproveExpenseClaimsAction(
  ids: string[],
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>('/expense-claims/bulk-approve', { ids });

  if (result.ok) {
    revalidatePath(routes.finance.expenses);
    revalidatePath(routes.finance.approvals);
  }

  return result;
}

// ─── Bulk Reject ─────────────────────────────────────────────────────────────

export async function bulkRejectExpenseClaimsAction(params: {
  ids: string[];
  reason: string;
}): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result = await client.post<CommandReceipt>('/expense-claims/bulk-reject', params);

  if (result.ok) {
    revalidatePath(routes.finance.expenses);
    revalidatePath(routes.finance.approvals);
  }

  return result;
}
