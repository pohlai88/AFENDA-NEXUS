import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';
import type { PaymentRunStatus } from '@afenda/contracts';

// ─── View Models ────────────────────────────────────────────────────────────

export interface PaymentRunListItem {
  id: string;
  runNumber: string;
  status: PaymentRunStatus;
  runDate: string;
  cutoffDate: string;
  currencyCode: string;
  totalAmount: string;
  itemCount: number;
  createdAt: string;
}

export interface PaymentRunItemView {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  supplierId: string;
  amount: string;
  discountAmount: string;
  netAmount: string;
  currencyCode: string;
  dueDate: string;
}

export interface PaymentRunDetail {
  id: string;
  runNumber: string;
  status: PaymentRunStatus;
  runDate: string;
  cutoffDate: string;
  currencyCode: string;
  companyId: string;
  companyName: string;
  totalAmount: string;
  totalDiscount: string;
  totalNet: string;
  itemCount: number;
  items: PaymentRunItemView[];
  createdAt: string;
  executedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface RemittanceAdviceView {
  runNumber: string;
  runDate: string;
  supplierName: string;
  currencyCode: string;
  totalGross: string;
  totalDiscount: string;
  totalNet: string;
  items: {
    invoiceId: string;
    invoiceNumber: string;
    grossAmount: string;
    discountAmount: string;
    netAmount: string;
  }[];
}

// ─── Query Functions ────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

export async function getPaymentRuns(
  ctx: Ctx,
  params: { status?: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<PaymentRunListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<PaymentRunListItem>>('/ap/payment-runs', query);
}

export async function getPaymentRun(
  ctx: Ctx,
  id: string,
): Promise<ApiResult<PaymentRunDetail>> {
  const client = createApiClient(ctx);
  return client.get<PaymentRunDetail>(`/ap/payment-runs/${id}`);
}

export async function getRemittanceAdvice(
  ctx: Ctx,
  runId: string,
): Promise<ApiResult<RemittanceAdviceView>> {
  const client = createApiClient(ctx);
  return client.get<RemittanceAdviceView>(`/ap/payment-runs/${runId}/remittance-advice`);
}

export async function createPaymentRun(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ap/payment-runs', body);
}

export async function addPaymentRunItem(
  ctx: Ctx,
  runId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/payment-runs/${runId}/items`, body);
}

export async function executePaymentRun(
  ctx: Ctx,
  runId: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/payment-runs/${runId}/execute`, {
    idempotencyKey: crypto.randomUUID(),
  });
}

export async function reversePaymentRun(
  ctx: Ctx,
  runId: string,
  reason: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/payment-runs/${runId}/reverse`, { reason });
}

export async function processBankRejection(
  ctx: Ctx,
  runId: string,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/ap/payment-runs/${runId}/bank-rejection`, body);
}

export async function getPaymentRunReport(
  ctx: Ctx,
  runId: string,
): Promise<ApiResult<{ summary: string; details: string }>> {
  const client = createApiClient(ctx);
  return client.get<{ summary: string; details: string }>(`/ap/payment-runs/${runId}/report`);
}

export async function getUnpaidInvoicesForRun(
  ctx: Ctx,
  params: { companyId: string; currencyCode: string; cutoffDate: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<PaymentRunItemView>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {
    companyId: params.companyId,
    currencyCode: params.currencyCode,
    cutoffDate: params.cutoffDate,
  };
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<PaymentRunItemView>>('/ap/invoices/unpaid', query);
}
