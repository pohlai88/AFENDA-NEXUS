'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateAccountPayload {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance: 'DEBIT' | 'CREDIT';
  isActive: boolean;
}

export interface UpdateAccountPayload {
  name?: string;
  type?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance?: 'DEBIT' | 'CREDIT';
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createAccountAction(
  data: CreateAccountPayload
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/accounts', data);
}

export async function updateAccountAction(
  accountId: string,
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
