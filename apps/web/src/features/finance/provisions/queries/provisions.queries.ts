import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, CommandReceipt } from '@/lib/types';

// ─── Context type ────────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

// ─── View Models ─────────────────────────────────────────────────────────────

export interface ProvisionView {
  id: string;
  provisionNumber: string;
  name: string;
  description: string;
  type: string;
  status: string;
  recognitionDate: string;
  expectedSettlementDate: string | null;
  initialAmount: number;
  currentBalance: number;
  currency: string;
  discountRate: number | null;
  presentValue: number | null;
  isDiscounted: boolean;
  utilizationYTD: number;
  additionsYTD: number;
  reversalsYTD: number;
  unwinding: number;
  glAccountId: string;
  glAccountCode: string;
  costCenterId: string | null;
  costCenterCode: string | null;
  contingentLiability: boolean;
  contingencyNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisionMovementView {
  id: string;
  provisionId: string;
  movementDate: string;
  movementType: string;
  amount: number;
  currency: string;
  description: string;
  reference: string | null;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ProvisionSummaryView {
  totalProvisions: number;
  activeProvisions: number;
  totalBalance: number;
  utilizationYTD: number;
  additionsYTD: number;
  reversalsYTD: number;
  contingentLiabilities: number;
  provisionsToReview: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getProvisions = cache(async (
  ctx: Ctx,
  params?: { status?: string; type?: string },
): Promise<ApiResult<{ data: ProvisionView[] }>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.type) query.type = params.type;
  return client.get<{ data: ProvisionView[] }>('/provisions', query);
});

export const getProvisionById = cache(async (
  ctx: Ctx,
  id: string,
): Promise<ApiResult<ProvisionView>> => {
  const client = createApiClient(ctx);
  return client.get<ProvisionView>(`/provisions/${id}`);
});

export const getProvisionMovements = cache(async (
  ctx: Ctx,
  provisionId: string,
): Promise<ApiResult<{ data: ProvisionMovementView[] }>> => {
  const client = createApiClient(ctx);
  return client.get<{ data: ProvisionMovementView[] }>(`/provisions/${provisionId}/movements`);
});

export const getProvisionSummary = cache(async (
  ctx: Ctx,
): Promise<ApiResult<ProvisionSummaryView>> => {
  const client = createApiClient(ctx);
  return client.get<ProvisionSummaryView>('/provisions/summary');
});

// ─── Commands ────────────────────────────────────────────────────────────────

export async function createProvision(
  ctx: Ctx,
  body: unknown,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/provisions', body);
}

export async function recordMovement(
  ctx: Ctx,
  provisionId: string,
  body: { movementType: string; amount: number; description: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/provisions/${provisionId}/movements`, body);
}

export async function reverseProvision(
  ctx: Ctx,
  provisionId: string,
  body: { amount: number; reason: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>(`/provisions/${provisionId}/reverse`, body);
}

export async function runUnwinding(
  ctx: Ctx,
  asOfDate: string,
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/provisions/unwinding', { asOfDate });
}
