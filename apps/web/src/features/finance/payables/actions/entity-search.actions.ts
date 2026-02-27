'use server';

import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { EntityOption } from '@/components/erp/entity-combobox';
import type { ApiResult } from '@/lib/types';

// ─── Supplier Search ────────────────────────────────────────────────────────

interface SupplierSearchResult {
  id: string;
  supplierCode: string;
  name: string;
  status: string;
}

export async function searchSuppliers(q: string): Promise<EntityOption[]> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result: ApiResult<SupplierSearchResult[]> = await client.get('/ap/suppliers', {
    q,
    limit: '20',
  });

  if (!result.ok) return [];

  return result.value.map((s) => ({
    id: s.id,
    label: `${s.supplierCode} — ${s.name}`,
    hint: s.status,
  }));
}

// ─── Account Search ─────────────────────────────────────────────────────────

interface AccountSearchResult {
  id: string;
  code: string;
  name: string;
  accountType: string;
}

export async function searchAccounts(q: string, ledgerId?: string): Promise<EntityOption[]> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const params: Record<string, string> = { q, limit: '20' };
  if (ledgerId) params.ledgerId = ledgerId;

  const result: ApiResult<AccountSearchResult[]> = await client.get('/accounts', params);

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

// ─── Company Search ─────────────────────────────────────────────────────────

interface CompanySearchResult {
  id: string;
  code: string;
  name: string;
  baseCurrency: string;
}

export async function searchCompanies(q: string): Promise<EntityOption[]> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const result: ApiResult<CompanySearchResult[]> = await client.get('/companies', {
    q,
    limit: '20',
  });

  if (!result.ok) return [];

  return result.value.map((c) => ({
    id: c.id,
    label: `${c.code} — ${c.name}`,
    hint: c.baseCurrency,
  }));
}

// ─── Ledger Search ──────────────────────────────────────────────────────────

interface LedgerSearchResult {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
}

export async function searchLedgers(q: string, companyId?: string): Promise<EntityOption[]> {
  const ctx = await getRequestContext();
  const client = createApiClient(ctx);
  const params: Record<string, string> = { q, limit: '20' };
  if (companyId) params.companyId = companyId;

  const result: ApiResult<LedgerSearchResult[]> = await client.get('/ledgers', params);

  if (!result.ok) return [];

  return result.value.map((l) => ({
    id: l.id,
    label: `${l.code} — ${l.name}`,
    hint: l.currencyCode,
  }));
}
