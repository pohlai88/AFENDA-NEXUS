import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';
import type { ArInvoiceStatus } from '@afenda/contracts';

// ─── Shared Posting Preview Types ────────────────────────────────────────────

export interface PostingPreviewLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

export interface PostingPreviewResult {
  ledgerName: string;
  periodName: string;
  currency: string;
  lines: PostingPreviewLine[];
  warnings: string[];
}

// ─── View Models (what the UI receives from the API) ────────────────────────

export interface ArInvoiceListItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerId: string;
  status: ArInvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  currencyCode: string;
  createdAt: string;
}

export interface ArInvoiceLineView {
  id: string;
  accountCode: string;
  accountName?: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  amount: string;
  taxAmount: string;
}

export interface ArInvoiceDetail {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerId: string;
  customerRef?: string;
  status: ArInvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  currencyCode: string;
  description?: string;
  companyId: string;
  ledgerId: string;
  lines: ArInvoiceLineView[];
  totalAmount: string;
  totalTax: string;
  amountPaid: string;
  balanceDue: string;
  createdAt: string;
  postedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  writtenOffAt?: string;
  writeOffReason?: string;
}

// ─── Query Functions (server-side, called from RSC pages) ───────────────────

export async function getArInvoices(
  ctx: { tenantId: string; userId: string; token: string },
  params: { status?: string; customerId?: string; page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<ArInvoiceListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.customerId) query.customerId = params.customerId;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<ArInvoiceListItem>>('/ar/invoices', query);
}

export async function getArInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  id: string
): Promise<ApiResult<ArInvoiceDetail>> {
  const client = createApiClient(ctx);
  return client.get<ArInvoiceDetail>(`/ar/invoices/${id}`);
}

export async function createArInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  body: unknown
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ar/invoices', body);
}

export async function approveArInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ar/invoices/${invoiceId}/approve`, {
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function previewArPosting(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  body: { fiscalPeriodId: string; arAccountId: string }
): Promise<ApiResult<PostingPreviewResult>> {
  const client = createApiClient(ctx);
  return client.post<PostingPreviewResult>(`/ar/invoices/${invoiceId}/preview-posting`, body);
}

export async function postArInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  body: { fiscalPeriodId: string; arAccountId: string }
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ar/invoices/${invoiceId}/post`, body);
}

export async function cancelArInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ar/invoices/${invoiceId}/cancel`, { reason });
}

export async function writeOffArInvoice(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  reason: string
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ar/invoices/${invoiceId}/write-off`, { reason });
}

export async function allocateArPayment(
  ctx: { tenantId: string; userId: string; token: string },
  invoiceId: string,
  body: {
    customerId: string;
    paymentDate: string;
    paymentRef: string;
    paymentAmount: number;
    currencyCode: string;
  }
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ar/invoices/${invoiceId}/allocate`, body);
}
