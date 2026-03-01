'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import {
  createInstrument as createInstrumentQ,
  recordFairValue as recordFairValueQ,
  calculateECL as calculateECLQ,
  disposeInstrument as disposeInstrumentQ,
} from '../queries/instruments.queries';

export async function createInstrumentAction(
  input: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createInstrumentQ(ctx, input);
  if (result.ok) revalidatePath(routes.finance.instruments);
  return result;
}

export async function recordFairValueAction(
  instrumentId: string,
  fairValue: number,
  level: string,
  valuationMethod: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await recordFairValueQ(ctx, instrumentId, { fairValue, level, valuationMethod });
  if (result.ok) revalidatePath(routes.finance.instruments);
  return result;
}

export async function calculateECLAction(
  instrumentId: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await calculateECLQ(ctx, instrumentId);
  if (result.ok) revalidatePath(routes.finance.instruments);
  return result;
}

export async function disposeInstrumentAction(
  instrumentId: string,
  salePrice: number,
  saleDate: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await disposeInstrumentQ(ctx, instrumentId, { salePrice, saleDate });
  if (result.ok) revalidatePath(routes.finance.instruments);
  return result;
}
