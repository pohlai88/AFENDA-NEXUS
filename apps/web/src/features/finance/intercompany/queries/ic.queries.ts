import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export type IcSettlementStatus = 'PENDING' | 'PAIRED' | 'RECONCILED';

export interface IcTransactionListItem {
  id: string;
  agreementId: string;
  description: string;
  amount: string;
  currency: string;
  transactionDate: string;
  settlementStatus: IcSettlementStatus;
  sourceCompanyName: string;
  mirrorCompanyName: string;
  sourceJournalRef?: string;
  mirrorJournalRef?: string;
}

export interface IcTransactionDetail {
  id: string;
  agreementId: string;
  description: string;
  amount: string;
  currency: string;
  transactionDate: string;
  settlementStatus: IcSettlementStatus;
  sourceCompanyId: string;
  sourceCompanyName: string;
  mirrorCompanyId: string;
  mirrorCompanyName: string;
  sourceJournalId?: string;
  sourceJournalRef?: string;
  mirrorJournalId?: string;
  mirrorJournalRef?: string;
  sourceLines: IcJournalLineView[];
  mirrorLines: IcJournalLineView[];
  createdAt: string;
}

export interface IcJournalLineView {
  accountId: string;
  accountCode: string;
  accountName?: string;
  debit: string;
  credit: string;
}

export interface IcAgreementListItem {
  id: string;
  sellerCompanyId: string;
  sellerCompanyName: string;
  buyerCompanyId: string;
  buyerCompanyName: string;
  pricingRule: string;
  markupPercent?: number;
  isActive: boolean;
}

export interface IcAgingRow {
  companyId: string;
  companyName: string;
  counterpartyId: string;
  counterpartyName: string;
  currency: string;
  current: string;
  days30: string;
  days60: string;
  days90Plus: string;
  total: string;
}

export interface IcAgingResult {
  rows: IcAgingRow[];
  asOfDate: string;
  currency: string;
  grandTotal: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

type RequestCtx = { tenantId: string; userId: string; token: string };

export const getIcTransactions = cache(async (
  ctx: RequestCtx,
  params: { status?: string; page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<IcTransactionListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<IcTransactionListItem>>('/ic-transactions', query);
});

export const getIcTransaction = cache(async (
  ctx: RequestCtx,
  id: string
): Promise<ApiResult<IcTransactionDetail>> => {
  const client = createApiClient(ctx);
  return client.get<IcTransactionDetail>(`/ic-transactions/${id}`);
});

export const getIcAgreements = cache(async (
  ctx: RequestCtx,
  params: { page?: string; limit?: string } = {}
): Promise<ApiResult<PaginatedResponse<IcAgreementListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<IcAgreementListItem>>('/ic-agreements', query);
});

export const getIcAging = cache(async (
  ctx: RequestCtx,
  params: { currency?: string; asOfDate?: string }
): Promise<ApiResult<IcAgingResult>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.currency) query.currency = params.currency;
  if (params.asOfDate) query.asOfDate = params.asOfDate;

  return client.get<IcAgingResult>('/reports/ic-aging', query);
});

// ─── Posting Preview Types ──────────────────────────────────────────────────

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

export interface IcTransactionPreviewResult {
  sourceJournal: PostingPreviewResult;
  mirrorJournal: PostingPreviewResult;
}

// ─── Preview Query ──────────────────────────────────────────────────────────

export async function previewIcTransaction(
  ctx: RequestCtx,
  body: Record<string, unknown>
): Promise<ApiResult<IcTransactionPreviewResult>> {
  const client = createApiClient(ctx);
  return client.post<IcTransactionPreviewResult>('/ic-transactions/preview', body);
}
