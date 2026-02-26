import { createApiClient } from '@/lib/api-client';
import type { ApiResult, PaginatedResponse } from '@/lib/types';

// ─── View Models ────────────────────────────────────────────────────────────

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface AccountListItem {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId: string | null;
  isActive: boolean;
}

export interface AccountDetail {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId: string | null;
  isActive: boolean;
  companyId: string;
}

// ─── Query Functions ────────────────────────────────────────────────────────

export async function getAccounts(
  ctx: { tenantId: string; userId: string; token: string },
  params: { type?: string; active?: string; page?: string; limit?: string }
): Promise<ApiResult<PaginatedResponse<AccountListItem>>> {
  const client = createApiClient(ctx);
  const query: Record<string, string> = {};
  if (params.type) query.type = params.type;
  if (params.active) query.active = params.active;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  return client.get<PaginatedResponse<AccountListItem>>('/accounts', query);
}

export async function getAccount(
  ctx: { tenantId: string; userId: string; token: string },
  id: string
): Promise<ApiResult<AccountDetail>> {
  const client = createApiClient(ctx);
  return client.get<AccountDetail>(`/accounts/${id}`);
}
