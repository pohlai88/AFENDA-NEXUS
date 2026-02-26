'use server';

import type { ApproveItemsInput, RejectItemsInput, DelegateItemsInput } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { routes } from '@/lib/constants';

// ─── Server Actions ──────────────────────────────────────────────────────────

export async function approveItems(input: ApproveItemsInput) {
  const { itemIds, comment } = input;

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // TODO: Replace with actual API call
  console.log('Approving items:', itemIds, 'Comment:', comment);

  revalidatePath(routes.finance.approvals);

  return {
    ok: true as const,
    data: {
      processedCount: itemIds.length,
      message: `Successfully approved ${itemIds.length} item(s)`,
    },
  };
}

export async function rejectItems(input: RejectItemsInput) {
  const { itemIds, comment } = input;

  if (!comment || comment.trim().length === 0) {
    return {
      ok: false as const,
      error: 'A comment is required when rejecting items',
    };
  }

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // TODO: Replace with actual API call
  console.log('Rejecting items:', itemIds, 'Reason:', comment);

  revalidatePath(routes.finance.approvals);

  return {
    ok: true as const,
    data: {
      processedCount: itemIds.length,
      message: `Rejected ${itemIds.length} item(s)`,
    },
  };
}

export async function delegateItems(input: DelegateItemsInput) {
  const { itemIds, delegateTo, comment } = input;

  if (!delegateTo || delegateTo.trim().length === 0) {
    return {
      ok: false as const,
      error: 'A delegate user is required',
    };
  }

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // TODO: Replace with actual API call
  console.log('Delegating items:', itemIds, 'To:', delegateTo, 'Comment:', comment);

  revalidatePath(routes.finance.approvals);

  return {
    ok: true as const,
    data: {
      processedCount: itemIds.length,
      message: `Delegated ${itemIds.length} item(s) to ${delegateTo}`,
    },
  };
}

export async function escalateItems(itemIds: string[]) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // TODO: Replace with actual API call
  console.log('Escalating items:', itemIds);

  revalidatePath(routes.finance.approvals);

  return {
    ok: true as const,
    data: {
      processedCount: itemIds.length,
      message: `Escalated ${itemIds.length} item(s) to next approver`,
    },
  };
}
