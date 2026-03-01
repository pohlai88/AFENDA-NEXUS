import { cache } from 'react';
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

export const getPaymentRuns = cache(async (
  ctx: Ctx,
  params: { status?: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<PaymentRunListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<PaymentRunListItem>>('/ap/payment-runs', query);
});

export const getPaymentRun = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<PaymentRunDetail>> => {
  const client = createApiClient(ctx);
  return client.get<PaymentRunDetail>(`/ap/payment-runs/${id}`);
});

export const getRemittanceAdvice = cache(async (
  ctx: Ctx,
  runId: string,
): Promise<ApiResult<RemittanceAdviceView>> => {
  const client = createApiClient(ctx);
  return client.get<RemittanceAdviceView>(`/ap/payment-runs/${runId}/remittance-advice`);
});

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

export const getPaymentRunReport = cache(async (
  ctx: Ctx,
  runId: string,
): Promise<ApiResult<{ summary: string; details: string }>> => {
  const client = createApiClient(ctx);
  return client.get<{ summary: string; details: string }>(`/ap/payment-runs/${runId}/report`);
});

export interface PaymentProposalGroup {
  groupKey: string;
  supplierId: string;
  supplierName: string;
  paymentMethod: string;
  bankAccountId: string | null;
  currencyCode: string;
  items: Array<{
    invoiceId: string;
    invoiceNumber: string;
    dueDate: string;
    outstandingAmount: string;
    discountAmount: string;
    netPayable: string;
    discountEligible: boolean;
    selectionReason: 'DUE' | 'DISCOUNT_OPPORTUNITY';
  }>;
  totalGross: string;
  totalDiscount: string;
  totalNet: string;
}

export interface PaymentProposalResponse {
  paymentDate: string;
  cutoffDate: string;
  groups: PaymentProposalGroup[];
  summary: {
    totalInvoices: number;
    totalGroups: number;
    totalGross: string;
    totalDiscount: string;
    totalNet: string;
    discountOpportunityCount: number;
    discountSavings: string;
  };
}

export const getPaymentProposal = cache(async (
  ctx: Ctx,
  params: { companyId: string; runDate: string; cutoffDate: string; currencyCode: string; includeDiscountOpportunities?: boolean },
): Promise<ApiResult<PaymentProposalResponse>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {
    companyId: params.companyId,
    runDate: params.runDate,
    cutoffDate: params.cutoffDate,
    currencyCode: params.currencyCode,
  };
  if (params.includeDiscountOpportunities !== undefined) {
    query.includeDiscountOpportunities = String(params.includeDiscountOpportunities);
  }
  return client.get<PaymentProposalResponse>('/ap/payment-proposal', query);
});

export const getUnpaidInvoicesForRun = cache(async (
  ctx: Ctx,
  params: { companyId: string; currencyCode: string; cutoffDate: string; page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<PaymentRunItemView>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {
    companyId: params.companyId,
    currencyCode: params.currencyCode,
    cutoffDate: params.cutoffDate,
  };
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<PaymentRunItemView>>('/ap/invoices/unpaid', query);
});
