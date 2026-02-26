'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { UpsertBudgetEntry } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Budget Entry Mutations ─────────────────────────────────────────────────

export async function upsertBudgetEntryAction(
  data: UpsertBudgetEntry
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/budget-entries', data);
}
