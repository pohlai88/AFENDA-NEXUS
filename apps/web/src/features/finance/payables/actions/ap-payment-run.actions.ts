'use server';

import { getRequestContext } from '@/lib/auth';
import {
  createPaymentRun,
  executePaymentRun,
  reversePaymentRun,
  addPaymentRunItem,
  processBankRejection,
  getPaymentRunReport,
  getPaymentProposal,
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

export async function getPaymentProposalAction(
  params: { companyId: string; runDate: string; cutoffDate: string; currencyCode: string; includeDiscountOpportunities?: boolean },
): Promise<ApiResult<import('../queries/ap-payment-run.queries').PaymentProposalResponse>> {
  const ctx = await getRequestContext();
  return getPaymentProposal(ctx, params);
}

/** Fetches payment run report and returns JSON for client-side download. */
export async function downloadPaymentRunReportAction(
  runId: string,
): Promise<ApiResult<{ filename: string; content: string }>> {
  const ctx = await getRequestContext();
  const result = await getPaymentRunReport(ctx, runId);
  if (!result.ok) return result;
  const report = result.value as Record<string, unknown>;
  const filename = `payment-run-report-${runId.slice(0, 8)}.json`;
  const content = JSON.stringify(report, (_k, v) =>
    typeof v === 'bigint' ? String(v) : v,
    2
  );
  return { ok: true, value: { filename, content } };
}
