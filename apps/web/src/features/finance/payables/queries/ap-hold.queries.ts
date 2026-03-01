import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';
import type { ApHoldType, ApHoldStatus } from '@afenda/contracts';

// ─── View Models ────────────────────────────────────────────────────────────

export interface ApHoldListItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  supplierId: string;
  holdType: ApHoldType;
  holdReason: string;
  status: ApHoldStatus;
  createdAt: string;
  releasedAt?: string;
  releaseReason?: string;
}

export interface InvoiceTimelineEntry {
  id: string;
  action: string;
  userId: string;
  userName?: string;
  timestamp: string;
  details?: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

export const getHolds = cache(async (
  ctx: Ctx,
  params: {
    status?: string;
    holdType?: string;
    supplierId?: string;
    fromDate?: string;
    toDate?: string;
    page?: string;
    limit?: string;
  },
): Promise<ApiResult<PaginatedResponse<ApHoldListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.holdType) query.holdType = params.holdType;
  if (params.supplierId) query.supplierId = params.supplierId;
  if (params.fromDate) query.fromDate = params.fromDate;
  if (params.toDate) query.toDate = params.toDate;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<ApHoldListItem>>('/ap/holds', query);
});

export async function releaseHold(
  ctx: Ctx,
  holdId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/holds/${holdId}/release`, { releaseReason: reason });
}

export const getInvoiceTimeline = cache(async (
  ctx: Ctx,
  invoiceId: string,
): Promise<ApiResult<InvoiceTimelineEntry[]>> => {
  const client = createApiClient(ctx);
  return client.get<InvoiceTimelineEntry[]>(`/ap/invoices/${invoiceId}/timeline`);
});

export const getInvoiceHolds = cache(async (
  ctx: Ctx,
  invoiceId: string,
): Promise<ApiResult<ApHoldListItem[]>> => {
  const client = createApiClient(ctx);
  return client.get<ApHoldListItem[]>(`/ap/invoices/${invoiceId}/holds`);
});
