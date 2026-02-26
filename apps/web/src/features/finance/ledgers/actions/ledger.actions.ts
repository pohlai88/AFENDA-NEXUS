'use server';

import type { CreateLedgerPayload } from '@afenda/contracts';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createLedgerAction(
  data: CreateLedgerPayload
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ledgers', data);
}
