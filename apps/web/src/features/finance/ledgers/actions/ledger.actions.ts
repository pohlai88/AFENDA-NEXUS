'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateLedgerPayload {
  name: string;
  companyId: string;
  baseCurrencyCode: string;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createLedgerAction(
  data: CreateLedgerPayload
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ledgers', data);
}
