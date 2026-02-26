'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── FX Rate Mutations ─────────────────────────────────────────────────────

export async function createFxRateAction(data: {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  effectiveDate: string;
  source?: string;
}): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/fx-rates', data);
}

export async function updateFxRateAction(
  rateId: string,
  data: {
    rate?: string;
    effectiveDate?: string;
    expiresAt?: string | null;
    source?: string;
  }
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.patch<CommandReceipt>(`/fx-rates/${rateId}`, data);
}

export async function approveFxRateAction(rateId: string): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/fx-rates/${rateId}/approve`);
}
