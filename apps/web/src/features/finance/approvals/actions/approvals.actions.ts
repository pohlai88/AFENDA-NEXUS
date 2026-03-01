'use server';

import type { ApproveItemsInput, RejectItemsInput, DelegateItemsInput } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { CommandReceipt } from '@/lib/types';
import { routes } from '@/lib/constants';

// ─── Server Actions ──────────────────────────────────────────────────────────

export async function approveItems(input: ApproveItemsInput) {
  const { itemIds, comment } = input;
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const results = await Promise.all(
    itemIds.map((id) =>
      client.post<CommandReceipt>(`/approvals/${id}/approve`, { reason: comment ?? '' })
    )
  );

  const failures = results.filter((r) => !r.ok);
  revalidatePath(routes.finance.approvals);

  if (failures.length > 0) {
    return {
      ok: false as const,
      error: `Failed to approve ${failures.length} of ${itemIds.length} item(s)`,
    };
  }

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

  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const results = await Promise.all(
    itemIds.map((id) =>
      client.post<CommandReceipt>(`/approvals/${id}/reject`, { reason: comment })
    )
  );

  const failures = results.filter((r) => !r.ok);
  revalidatePath(routes.finance.approvals);

  if (failures.length > 0) {
    return {
      ok: false as const,
      error: `Failed to reject ${failures.length} of ${itemIds.length} item(s)`,
    };
  }

  return {
    ok: true as const,
    data: {
      processedCount: itemIds.length,
      message: `Rejected ${itemIds.length} item(s)`,
    },
  };
}

export async function delegateItems(input: DelegateItemsInput) {
  const { itemIds, delegateTo, comment: _comment } = input;

  if (!delegateTo || delegateTo.trim().length === 0) {
    return {
      ok: false as const,
      error: 'A delegate user is required',
    };
  }

  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  const results = await Promise.all(
    itemIds.map((id) =>
      client.post<CommandReceipt>(`/approvals/${id}/delegate`, { delegateTo })
    )
  );

  const failures = results.filter((r) => !r.ok);
  revalidatePath(routes.finance.approvals);

  if (failures.length > 0) {
    return {
      ok: false as const,
      error: `Failed to delegate ${failures.length} of ${itemIds.length} item(s)`,
    };
  }

  return {
    ok: true as const,
    data: {
      processedCount: itemIds.length,
      message: `Delegated ${itemIds.length} item(s) to ${delegateTo}`,
    },
  };
}

export async function escalateItems(itemIds: string[]) {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);

  // Escalation is typically handled by re-submitting or delegating to next level
  const results = await Promise.all(
    itemIds.map((id) =>
      client.post<CommandReceipt>(`/approvals/${id}/delegate`, { delegateTo: '__escalate__' })
    )
  );

  const failures = results.filter((r) => !r.ok);
  revalidatePath(routes.finance.approvals);

  if (failures.length > 0) {
    return {
      ok: false as const,
      error: `Failed to escalate ${failures.length} of ${itemIds.length} item(s)`,
    };
  }

  return {
    ok: true as const,
    data: {
      processedCount: itemIds.length,
      message: `Escalated ${itemIds.length} item(s) to next approver`,
    },
  };
}
