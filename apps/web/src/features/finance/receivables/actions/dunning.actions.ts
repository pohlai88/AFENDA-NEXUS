'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import { runDunningProcess } from '../queries/dunning.queries';

export async function runDunningAction(
  runDate: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await runDunningProcess(ctx, { runDate });
  if (result.ok) revalidatePath(routes.finance.dunning);
  return result;
}
