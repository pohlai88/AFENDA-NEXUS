import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export interface LedgerListItem {
  id: string;
  companyId: string;
  name: string;
  baseCurrency: string;
  companyName?: string;
}

export interface LedgerDetail {
  id: string;
  companyId: string;
  companyName?: string;
  name: string;
  baseCurrency: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

export const getLedgers = cache(async (
  ctx: { tenantId: string; userId: string; token: string },
  params: { page?: string; limit?: string } = {}
): Promise<ApiResult<PaginatedResponse<LedgerListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};

  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<LedgerListItem>>('/ledgers', query);
});

export const getLedger = cache(async (
  ctx: { tenantId: string; userId: string; token: string },
  id: string
): Promise<ApiResult<LedgerDetail>> => {
  const client = createApiClient(ctx);
  return client.get<LedgerDetail>(`/ledgers/${id}`);
});
