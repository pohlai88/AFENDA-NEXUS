'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { routes } from '@/lib/constants';
import type { CreateRevenueContract, RecognizeRevenue } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';
import {
  createRevenueContract as createQ,
  recognizeRevenue as recognizeQ,
  previewRevenueRecognition as previewQ,
  type PostingPreviewResult,
} from '../queries/revenue.queries';

export async function createRevenueContractAction(
  data: CreateRevenueContract,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await createQ(ctx, data);
  if (result.ok) revalidatePath(routes.finance.revenueRecognition);
  return result;
}

export async function recognizeRevenueAction(
  contractId: string,
  periodId: string,
  ledgerId: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  const result = await recognizeQ(ctx, contractId, { periodId, ledgerId });
  if (result.ok) revalidatePath(routes.finance.revenueRecognition);
  return result;
}

export async function previewRevenueRecognitionAction(
  contractId: string,
  periodId: string,
  ledgerId: string
): Promise<ApiResult<PostingPreviewResult>> {
  const ctx = await getRequestContext();
  return previewQ(ctx, contractId, { periodId, ledgerId });
}
