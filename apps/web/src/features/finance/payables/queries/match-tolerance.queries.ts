import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';
import type { ToleranceScope } from '@afenda/contracts';

export interface MatchToleranceListItem {
  id: string;
  tenantId: string;
  scope: ToleranceScope;
  scopeEntityId: string | null;
  companyId: string | null;
  toleranceBps: number;
  quantityTolerancePercent: number;
  autoHold: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type Ctx = { tenantId: string; userId: string; token: string };

export const getMatchTolerances = cache(async (
  ctx: Ctx
): Promise<ApiResult<MatchToleranceListItem[]>> => {
  const client = createApiClient(ctx);
  return client.get<MatchToleranceListItem[]>('/ap/match-tolerances');
});

export async function createMatchTolerance(
  ctx: Ctx,
  body: {
    scope: ToleranceScope;
    scopeEntityId?: string | null;
    companyId?: string | null;
    toleranceBps: number;
    quantityTolerancePercent?: number;
    autoHold?: boolean;
  }
): Promise<ApiResult<MatchToleranceListItem>> {
  const client = createApiClient(ctx);
  return client.post<MatchToleranceListItem>('/ap/match-tolerances', body);
}

export async function updateMatchTolerance(
  ctx: Ctx,
  id: string,
  body: {
    toleranceBps?: number;
    quantityTolerancePercent?: number;
    autoHold?: boolean;
    isActive?: boolean;
  }
): Promise<ApiResult<MatchToleranceListItem>> {
  const client = createApiClient(ctx);
  return client.patch<MatchToleranceListItem>(`/ap/match-tolerances/${id}`, body);
}
