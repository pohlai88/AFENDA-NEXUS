'use server';

import type { IdParam, CreateAccountPayload, UpdateAccountPayload } from '@afenda/contracts';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createAccountAction(
  data: CreateAccountPayload
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/accounts', data);
}

export async function updateAccountAction(
  accountId: IdParam['id'],
  data: UpdateAccountPayload
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/accounts/${accountId}`, data);
}

export async function toggleAccountActiveAction(
  accountId: string,
  isActive: boolean
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/accounts/${accountId}`, { isActive });
}
