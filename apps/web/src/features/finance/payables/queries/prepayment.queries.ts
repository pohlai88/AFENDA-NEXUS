import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';

// ─── Context type ────────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

// ─── View Models ─────────────────────────────────────────────────────────────

export interface PrepaymentListItem {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierId: string;
  status: string;
  totalAmount: string;
  appliedAmount: string;
  remainingAmount: string;
  currencyCode: string;
  invoiceDate: string;
  createdAt: string;
}

export interface PrepaymentApplicationView {
  id: string;
  targetInvoiceId: string;
  targetInvoiceNumber: string;
  amount: string;
  appliedAt: string;
}

export interface PrepaymentDetail extends PrepaymentListItem {
  applications: PrepaymentApplicationView[];
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export const getPrepayments = cache(async (
  ctx: Ctx,
  params: { page?: string; limit?: string; status?: string },
): Promise<ApiResult<PaginatedResponse<PrepaymentListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = { type: 'PREPAYMENT' };
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.status) query.status = params.status;
  return client.get<PaginatedResponse<PrepaymentListItem>>('/ap/prepayments', query);
});

export const getPrepayment = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<PrepaymentDetail>> => {
  const client = createApiClient(ctx);
  return client.get<PrepaymentDetail>(`/ap/prepayments/${id}`);
});

// ─── Command Functions ───────────────────────────────────────────────────────

export async function applyPrepayment(
  ctx: Ctx,
  body: { prepaymentId: string; targetInvoiceId: string; amount: number },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ap/prepayments/apply', body);
}
