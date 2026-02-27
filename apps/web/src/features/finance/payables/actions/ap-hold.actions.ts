'use server';

import { getRequestContext } from '@/lib/auth';
import { releaseHold } from '../queries/ap-hold.queries';
import type { ApiResult, CommandReceipt } from '@/lib/types';

export async function releaseHoldAction(
  holdId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return releaseHold(ctx, holdId, reason);
}
