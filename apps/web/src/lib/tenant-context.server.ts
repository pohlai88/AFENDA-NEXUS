import { cookies } from 'next/headers';
import { getLedgers } from '@/features/finance/ledgers/queries/ledger.queries';
import { getPeriods } from '@/features/finance/periods/queries/period.queries';
import type { CompanyContext, PeriodContext, TenantContext } from '@/lib/types';

interface RequestContext {
  tenantId: string;
  userId: string;
  token: string;
}

function pickActivePeriod(periods: PeriodContext[]): PeriodContext | undefined {
  const sorted = [...periods].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.period - a.period;
  });

  const openPeriod = sorted.find((period) => period.status === 'OPEN');
  return openPeriod ?? sorted[0];
}

export async function buildInitialTenantContext(
  ctx: RequestContext
): Promise<TenantContext | undefined> {
  if (!ctx.tenantId) return undefined;

  const [cookieStore, ledgersResult, periodsResult] = await Promise.all([
    cookies(),
    getLedgers(ctx, { limit: '100' }),
    getPeriods(ctx, { page: '1', limit: '100' }),
  ]);

  if (!ledgersResult.ok || ledgersResult.value.data.length === 0) {
    return undefined;
  }

  const companiesById = new Map<string, CompanyContext>();

  for (const ledger of ledgersResult.value.data) {
    const existing = companiesById.get(ledger.companyId);
    if (!existing) {
      companiesById.set(ledger.companyId, {
        id: ledger.companyId,
        name: ledger.companyName ?? `Company ${ledger.companyId.slice(0, 8)}`,
        baseCurrency: ledger.baseCurrency,
      });
    }
  }

  const companies = Array.from(companiesById.values());
  const defaultCompanyId = companies[0]?.id;
  if (!defaultCompanyId) return undefined;

  const requestedCompanyId = cookieStore.get('active_company_id')?.value;
  const activeCompanyId =
    requestedCompanyId && companies.some((company) => company.id === requestedCompanyId)
      ? requestedCompanyId
      : defaultCompanyId;

  const periods: PeriodContext[] = periodsResult.ok
    ? periodsResult.value.data.map((period) => ({
        id: period.id,
        name: period.name,
        year: period.year,
        period: period.period,
        status: period.status,
      }))
    : [];

  return {
    tenantId: ctx.tenantId,
    tenantName: `Tenant ${ctx.tenantId.slice(0, 8)}`,
    companies,
    activeCompanyId,
    activePeriod: pickActivePeriod(periods),
  };
}
