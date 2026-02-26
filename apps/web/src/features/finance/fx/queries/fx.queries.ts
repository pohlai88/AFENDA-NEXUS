import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export interface FxRateListItem {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  effectiveDate: string;
  expiresAt?: string;
  source: string;
}

export interface FxRateDetail {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  effectiveDate: string;
  expiresAt?: string;
  source: string;
  createdAt: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

type RequestCtx = { tenantId: string; userId: string; token: string };

export async function getFxRates(
  ctx: RequestCtx,
  params: { from?: string; to?: string; date?: string; page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<FxRateListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.date) query.date = params.date;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<FxRateListItem>>('/fx-rates', query);
}

export async function getFxRate(ctx: RequestCtx, id: string): Promise<ApiResult<FxRateDetail>> {
  const client = createApiClient(ctx);
  return client.get<FxRateDetail>(`/fx-rates/${id}`);
}
