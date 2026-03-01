'use server';

import { getRequestContext } from '@/lib/auth';
import {
  createArInvoice,
  approveArInvoice,
  previewArPosting,
  postArInvoice,
  cancelArInvoice,
  writeOffArInvoice,
  allocateArPayment,
  type PostingPreviewResult,
} from '../queries/ar.queries';
import { createApiClient } from '@/lib/api-client';
import type { CreateArInvoice } from '@afenda/contracts';
import type { ApiResult, CommandReceipt, AuditEntry } from '@/lib/types';

// ─── Mutations (called from client components via useTransition) ────────────

export async function createArInvoiceAction(
  data: CreateArInvoice
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return createArInvoice(ctx, data);
}

export async function approveArInvoiceAction(
  invoiceId: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return approveArInvoice(ctx, invoiceId);
}

export async function previewArPostingAction(
  invoiceId: string,
  fiscalPeriodId: string,
  arAccountId: string
): Promise<ApiResult<PostingPreviewResult>> {
  const ctx = await getRequestContext();
  return previewArPosting(ctx, invoiceId, { fiscalPeriodId, arAccountId });
}

export async function postArInvoiceAction(
  invoiceId: string,
  fiscalPeriodId: string,
  arAccountId: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return postArInvoice(ctx, invoiceId, { fiscalPeriodId, arAccountId });
}

export async function cancelArInvoiceAction(
  invoiceId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return cancelArInvoice(ctx, invoiceId, reason);
}

export async function writeOffArInvoiceAction(
  invoiceId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return writeOffArInvoice(ctx, invoiceId, reason);
}

export async function allocateArPaymentAction(
  invoiceId: string,
  customerId: string,
  paymentDate: string,
  paymentRef: string,
  paymentAmount: number,
  currencyCode: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return allocateArPayment(ctx, invoiceId, {
    customerId,
    paymentDate,
    paymentRef,
    paymentAmount,
    currencyCode,
  });
}

// ─── Queries (called from server components) ───────────────────────────────

export async function getArInvoiceAuditAction(invoiceId: string): Promise<ApiResult<AuditEntry[]>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.get<AuditEntry[]>(`/ar/invoices/${invoiceId}/audit`);
}
