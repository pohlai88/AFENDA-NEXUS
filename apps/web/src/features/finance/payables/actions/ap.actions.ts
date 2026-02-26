'use server';

import { getRequestContext } from '@/lib/auth';
import {
  createApInvoice,
  approveApInvoice,
  postApInvoice,
  cancelApInvoice,
  recordApPayment,
} from '../queries/ap.queries';
import { createApiClient } from '@/lib/api-client';
import type { CreateApInvoice } from '@afenda/contracts';
import type { ApiResult, CommandReceipt, AuditEntry } from '@/lib/types';

// ─── Mutations (called from client components via useTransition) ────────────

export async function createApInvoiceAction(
  data: CreateApInvoice
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return createApInvoice(ctx, data);
}

export async function approveApInvoiceAction(
  invoiceId: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return approveApInvoice(ctx, invoiceId);
}

export async function postApInvoiceAction(
  invoiceId: string,
  fiscalPeriodId: string,
  apAccountId: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return postApInvoice(ctx, invoiceId, { fiscalPeriodId, apAccountId });
}

export async function cancelApInvoiceAction(
  invoiceId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return cancelApInvoice(ctx, invoiceId, reason);
}

export async function recordApPaymentAction(
  invoiceId: string,
  amount: number,
  paymentDate: string,
  paymentRef: string
): Promise<ApiResult<CommandReceipt>> {
  const ctx = await getRequestContext();
  return recordApPayment(ctx, invoiceId, { amount, paymentDate, paymentRef });
}

// ─── Queries (called from server components) ───────────────────────────────

export async function getApInvoiceAuditAction(invoiceId: string): Promise<ApiResult<AuditEntry[]>> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  return client.get<AuditEntry[]>(`/ap/invoices/${invoiceId}/audit`);
}
