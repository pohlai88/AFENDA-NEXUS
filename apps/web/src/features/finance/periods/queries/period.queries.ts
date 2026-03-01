import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface PeriodListItem {
  id: string;
  name: string;
  year: number;
  period: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
}

export interface PeriodDetail {
  id: string;
  companyId: string;
  name: string;
  year: number;
  period: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
}

// ─── Query Functions ────────────────────────────────────────────────────────

export const getPeriods = cache(async (
  ctx: { tenantId: string; userId: string; token: string },
  params: { year?: string; status?: string; page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<PeriodListItem>>> => {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.year) query.year = params.year;
  if (params.status) query.status = params.status;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<PeriodListItem>>('/periods', query);
});

export const getPeriod = cache(async (
  ctx: { tenantId: string; userId: string; token: string },
  id: string
): Promise<ApiResult<PeriodDetail>> => {
  const client = createApiClient(ctx);
  return client.get<PeriodDetail>(`/periods/${id}`);
});
