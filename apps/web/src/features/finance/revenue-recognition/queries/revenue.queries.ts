import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';

// ─── Context type ────────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

// ─── Posting Preview Types ───────────────────────────────────────────────────

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

// ─── View Models ─────────────────────────────────────────────────────────────

export interface RevenueContractListItem {
  id: string;
  contractNumber: string;
  customerName: string;
  totalAmount: string;
  recognizedAmount: string;
  deferredAmount: string;
  currency: string;
  recognitionMethod: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface RecognitionMilestoneView {
  id: string;
  milestoneName: string;
  targetDate: string;
  completionPercent: number;
  amount: string;
  isRecognized: boolean;
  recognizedAt: string | null;
}

export interface RevenueContractDetail {
  id: string;
  contractNumber: string;
  customerName: string;
  companyId: string;
  totalAmount: string;
  recognizedAmount: string;
  deferredAmount: string;
  currency: string;
  recognitionMethod: string;
  startDate: string;
  endDate: string;
  deferredAccountId: string;
  revenueAccountId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export const getRevenueContracts = cache(async (
  ctx: Ctx,
  params: { page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<RevenueContractListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<RevenueContractListItem>>('/revenue-contracts', query);
});

export const getRevenueContract = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<RevenueContractDetail>> => {
  const client = createApiClient(ctx);
  return client.get<RevenueContractDetail>(`/revenue-contracts/${id}`);
});

export const getContractMilestones = cache(async (
  ctx: Ctx,
  contractId: string,
): Promise<ApiResult<RecognitionMilestoneView[]>> => {
  const client = createApiClient(ctx);
  return client.get<RecognitionMilestoneView[]>(`/revenue-contracts/${contractId}/milestones`);
});

// ─── Command Functions ───────────────────────────────────────────────────────

export async function createRevenueContract(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/revenue-contracts', body);
}

export async function recognizeRevenue(
  ctx: Ctx,
  contractId: string,
  body: { periodId: string; ledgerId: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/revenue-contracts/${contractId}/recognize`, body);
}

// ─── Preview Query ───────────────────────────────────────────────────────────

export async function previewRevenueRecognition(
  ctx: Ctx,
  contractId: string,
  body: { periodId: string; ledgerId: string }
): Promise<ApiResult<PostingPreviewResult>> {
  const client = createApiClient(ctx);
  return client.post<PostingPreviewResult>(
    `/revenue-contracts/${contractId}/preview-recognition`,
    body
  );
}
