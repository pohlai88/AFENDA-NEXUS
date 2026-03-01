import { cache } from 'react';
import { cookies } from 'next/headers';
import { toSorted } from '@/lib/utils/array';
import { getLedgers } from '@/features/finance/ledgers/queries/ledger.queries';
import { getPeriods } from '@/features/finance/periods/queries/period.queries';
import { createApiClient } from '@/lib/api-client';
import type { CompanyContext, PeriodContext, TenantContext } from '@/lib/types';

interface RequestContext {
  tenantId: string;
  userId: string;
  token: string;
}

/**
 * Resolve org name from Neon Auth API using the session token.
 * Falls back to truncated ID if the API call fails (non-blocking).
 */
async function resolveOrgName(
  token: string,
  activeOrgId: string
): Promise<string> {
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!neonAuthBaseUrl) return `Org ${activeOrgId.slice(0, 8)}`;

  try {
    const resp = await fetch(
      `${neonAuthBaseUrl}/api/auth/list-organizations`,
      {
        headers: { cookie: `neonauth.session_token=${token}` },
        next: { revalidate: 300 },
      }
    );
    if (!resp.ok) return `Org ${activeOrgId.slice(0, 8)}`;

    const orgs = (await resp.json()) as Array<{ id: string; name: string }>;
    const active = orgs.find((o) => o.id === activeOrgId);
    return active?.name ?? `Org ${activeOrgId.slice(0, 8)}`;
  } catch {
    return `Org ${activeOrgId.slice(0, 8)}`;
  }
}

function pickActivePeriod(periods: PeriodContext[]): PeriodContext | undefined {
  const sorted = toSorted(periods, (a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.period - a.period;
  });

  const openPeriod = sorted.find((period) => period.status === 'OPEN');
  return openPeriod ?? sorted[0];
}

export const buildInitialTenantContext = cache(
  async (ctx: RequestContext): Promise<TenantContext | undefined> => {
    if (!ctx.tenantId) return undefined;

    const api = createApiClient(ctx);

    const [cookieStore, ledgersResult, periodsResult, orgName, orgSettingsResult] = await Promise.all([
      cookies(),
      getLedgers(ctx, { limit: '100' }),
      getPeriods(ctx, { page: '1', limit: '100' }),
      resolveOrgName(ctx.token, ctx.tenantId),
      api.get<{ defaultCurrency: string; locale: string; timezone: string; dateFormat: string }>(
        '/settings/org'
      ).catch(() => null),
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

    const orgSettings =
      orgSettingsResult && 'ok' in orgSettingsResult && orgSettingsResult.ok
        ? {
          defaultCurrency: orgSettingsResult.value.defaultCurrency,
          locale: orgSettingsResult.value.locale,
          timezone: orgSettingsResult.value.timezone,
          dateFormat: orgSettingsResult.value.dateFormat,
        }
        : undefined;

    return {
      tenantId: ctx.tenantId,
      tenantName: orgName,
      companies,
      activeCompanyId,
      activePeriod: pickActivePeriod(periods),
      orgSettings,
    };
  }
);
