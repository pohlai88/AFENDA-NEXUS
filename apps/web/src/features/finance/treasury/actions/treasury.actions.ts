'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import {
  createForecastCmd,
  createCovenantCmd,
  testCovenantCmd,
  createICLoanCmd,
  recordLoanPaymentCmd,
} from '../queries/treasury.queries';

export async function createForecastAction(input: Record<string, unknown>) {
  const ctx = await getRequestContext();
  const result = await createForecastCmd(ctx, input);
  revalidatePath(routes.finance.treasury);
  return result;
}

export async function createCovenantAction(input: Record<string, unknown>) {
  const ctx = await getRequestContext();
  const result = await createCovenantCmd(ctx, input);
  revalidatePath(routes.finance.treasury);
  return result;
}

export async function testCovenantAction(input: Record<string, unknown>) {
  const ctx = await getRequestContext();
  const result = await testCovenantCmd(ctx, input);
  revalidatePath(routes.finance.treasury);
  return result;
}

export async function createICLoanAction(input: Record<string, unknown>) {
  const ctx = await getRequestContext();
  const result = await createICLoanCmd(ctx, input);
  revalidatePath(routes.finance.treasury);
  return result;
}

export async function recordLoanPaymentAction(
  loanId: string,
  input: Record<string, unknown>,
) {
  const ctx = await getRequestContext();
  const result = await recordLoanPaymentCmd(ctx, loanId, input);
  revalidatePath(routes.finance.treasury);
  return result;
}
