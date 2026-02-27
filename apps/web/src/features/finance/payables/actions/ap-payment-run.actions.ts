'use server';

import { getRequestContext } from '@/lib/auth';
import {
  createPaymentRun,
  executePaymentRun,
  reversePaymentRun,
  addPaymentRunItem,
  processBankRejection,
} from '../queries/ap-payment-run.queries';
import type { CreatePaymentRun, AddPaymentRunItem } from '@afenda/contracts';
import type { ApiResult, CommandReceipt } from '@/lib/types';

export async function createPaymentRunAction(
  data: CreatePaymentRun,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return createPaymentRun(ctx, data);
}

export async function addPaymentRunItemAction(
  runId: string,
  data: AddPaymentRunItem,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return addPaymentRunItem(ctx, runId, data);
}

export async function executePaymentRunAction(
  runId: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return executePaymentRun(ctx, runId);
}

export async function reversePaymentRunAction(
  runId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return reversePaymentRun(ctx, runId, reason);
}

export async function processBankRejectionAction(
  runId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return processBankRejection(ctx, runId, body);
}
