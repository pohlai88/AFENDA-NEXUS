'use server';

import type { IdParam } from '@afenda/contracts';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Period Lifecycle Actions ───────────────────────────────────────────────

export async function closePeriodAction(
  periodId: IdParam['id'],
  reason?: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/periods/${periodId}/close`, { reason });
}

export async function lockPeriodAction(
  periodId: string,
  reason?: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/periods/${periodId}/lock`, { reason });
}

export async function reopenPeriodAction(
  periodId: string,
  reason?: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/periods/${periodId}/reopen`, { reason });
}
