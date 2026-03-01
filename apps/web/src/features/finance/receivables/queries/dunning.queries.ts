import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse, CommandReceipt } from '@/lib/types';

// ─── Context type ────────────────────────────────────────────────────────────

type Ctx = { tenantId: string; userId: string; token: string };

// ─── View Models ─────────────────────────────────────────────────────────────

export interface DunningRunListItem {
  id: string;
  runDate: string;
  status: string;
  lettersGenerated: number;
  totalOutstanding: string;
  currencyCode: string;
  createdBy: string;
  createdAt: string;
}

export interface DunningLetterView {
  id: string;
  customerId: string;
  customerName: string;
  dunningLevel: number;
  totalOverdue: string;
  currencyCode: string;
  invoiceCount: number;
  status: string;
  sentAt: string | null;
}

export interface DunningRunDetail {
  id: string;
  runDate: string;
  status: string;
  lettersGenerated: number;
  totalOutstanding: string;
  currencyCode: string;
  createdBy: string;
  createdAt: string;
  letters: DunningLetterView[];
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getDunningRuns(
  ctx: Ctx,
  params: { page?: string; limit?: string },
): Promise<ApiResult<PaginatedResponse<DunningRunListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  return client.get<PaginatedResponse<DunningRunListItem>>('/ar/dunning', query);
}

export async function getDunningRun(
  ctx: Ctx,
  id: string,
): Promise<ApiResult<DunningRunDetail>> {
  const client = createApiClient(ctx);
  return client.get<DunningRunDetail>(`/ar/dunning/${id}`);
}

// ─── Command Functions ───────────────────────────────────────────────────────

export async function runDunningProcess(
  ctx: Ctx,
  body: { runDate: string },
): Promise<ApiResult<CommandReceipt>> {
  const client = createApiClient(ctx);
  return client.post<CommandReceipt>('/ar/dunning', body);
}
