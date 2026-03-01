'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { EntityOption } from '@/components/erp/entity-combobox';
import type { ApiResult } from '@/lib/types';

// ─── Account Search ─────────────────────────────────────────────────────────

interface AccountSearchResult {
  id: string;
  code: string;
  name: string;
  accountType: string;
}

export async function searchAccounts(q: string): Promise<EntityOption[]> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result: ApiResult<AccountSearchResult[]> = await client.get('/accounts', {
    q,
    limit: '20',
  });

  if (!result.ok) return [];

  return result.value.map((a) => ({
    id: a.id,
    label: `${a.code} — ${a.name}`,
    hint: a.accountType,
  }));
}

// ─── Fiscal Period Search ───────────────────────────────────────────────────

interface FiscalPeriodSearchResult {
  id: string;
  name: string;
  year: number;
  period: number;
  status: string;
}

export async function searchFiscalPeriods(q: string): Promise<EntityOption[]> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result: ApiResult<FiscalPeriodSearchResult[]> = await client.get('/fiscal-periods', {
    q,
    limit: '20',
    status: 'OPEN',
  });

  if (!result.ok) return [];

  return result.value.map((p) => ({
    id: p.id,
    label: `${p.name} — ${p.year} P${p.period}`,
    hint: p.status,
  }));
}
