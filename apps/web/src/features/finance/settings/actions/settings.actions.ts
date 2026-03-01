'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import type { CreateMatchTolerance, UpdateMatchTolerance } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import {
  createMatchTolerance as createQ,
  updateMatchTolerance as updateQ,
} from '../queries/settings.queries';

export async function createMatchToleranceAction(
  data: CreateMatchTolerance,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createQ(ctx, data);
  if (result.ok) revalidatePath(routes.finance.matchTolerance);
  return result;
}

export async function updateMatchToleranceAction(
  id: string,
  data: UpdateMatchTolerance,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await updateQ(ctx, id, data);
  if (result.ok) revalidatePath(routes.finance.matchTolerance);
  return result;
}
