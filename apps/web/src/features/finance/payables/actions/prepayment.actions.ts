'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import type { ApplyPrepaymentDto } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import { applyPrepayment as applyQ } from '../queries/prepayment.queries';

export async function applyPrepaymentAction(
  data: ApplyPrepaymentDto,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await applyQ(ctx, data);
  if (result.ok) revalidatePath(routes.finance.prepayments);
  return result;
}
