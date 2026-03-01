'use server';

import type { CreateProvisionInput } from '@afenda/contracts';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import {
  createProvision as createProvisionQ,
  recordMovement as recordMovementQ,
  reverseProvision as reverseProvisionQ,
  runUnwinding as runUnwindingQ,
} from '../queries/provisions.queries';

export async function createProvisionAction(
  input: CreateProvisionInput,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createProvisionQ(ctx, input);
  if (result.ok) revalidatePath(routes.finance.provisions);
  return result;
}

export async function recordMovementAction(
  provisionId: string,
  movementType: string,
  amount: number,
  description: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await recordMovementQ(ctx, provisionId, { movementType, amount, description });
  if (result.ok) {
    revalidatePath(routes.finance.provisions);
    revalidatePath(routes.finance.journals);
  }
  return result;
}

export async function reverseProvisionAction(
  provisionId: string,
  amount: number,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await reverseProvisionQ(ctx, provisionId, { amount, reason });
  if (result.ok) revalidatePath(routes.finance.provisions);
  return result;
}

export async function runUnwindingAction(
  asOfDate: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await runUnwindingQ(ctx, asOfDate);
  if (result.ok) revalidatePath(routes.finance.provisions);
  return result;
}
