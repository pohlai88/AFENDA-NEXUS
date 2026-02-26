import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';
import type { ApInvoiceStatus } from '@afenda/contracts';

// ─── View Models (what the UI receives from the API) ────────────────────────

export interface ApInvoiceListItem {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierId: string;
  status: ApInvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  currencyCode: string;
  createdAt: string;
}

export interface ApInvoiceLineView {
  id: string;
  accountCode: string;
  accountName?: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  amount: string;
  taxAmount: string;
}

export interface ApInvoiceDetail {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierId: string;
  supplierRef?: string;
  status: ApInvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  currencyCode: string;
  description?: string;
  poRef?: string;
  receiptRef?: string;
  companyId: string;
  ledgerId: string;
  lines: ApInvoiceLineView[];
  totalAmount: string;
  totalTax: string;
  amountPaid: string;
  balanceDue: string;
  createdAt: string;
  postedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// ─── Query Functions (server-side, called from RSC pages) ───────────────────

export async function getApInvoices(
  ctx: { tenantId: string; userId: string; token: string },
  params: { status?: string; supplierId?: string; page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<ApInvoiceListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.supplierId) query.supplierId = params.supplierId;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<ApInvoiceListItem>>('/ap/invoices', query);
}

export async function getApInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  id: string
): Promise<ApiResult<ApInvoiceDetail>> {
  const client = createApiClient(ctx);
  return client.get<ApInvoiceDetail>(`/ap/invoices/${id}`);
}

export async function createApInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  body: unknown
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ap/invoices', body);
}

export async function approveApInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/invoices/${invoiceId}/approve`, {
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function postApInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  body: { fiscalPeriodId: string; apAccountId: string }
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/invoices/${invoiceId}/post`, body);
}

export async function cancelApInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/invoices/${invoiceId}/cancel`, { reason });
}

export async function recordApPayment(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  body: { amount: number; paymentDate: string; paymentRef: string }
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/invoices/${invoiceId}/pay`, body);
}
