// ─── KPI Resolver Types ─────────────────────────────────────────────────────
// Raw metrics only — no 'template' (that's in the catalog).
// Server-only file: NEVER import from client code.

import { cache } from 'react';

/** Status indicator for KPI cards (On track / At risk / Overdue). */
export type KpiIndicator = 'on_track' | 'at_risk' | 'overdue';

/** Comparison data (vs prior period, vs budget, vs plan). */
export interface KpiComparison {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
}

export interface KPIResolverResult {
  id: string;
  value: string;
  formattedValue: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  sparklineData?: number[];
  buckets?: Array<{ label: string; value: number }>;
  status?: 'ok' | 'error';
  /** Status badge: on_track (green), at_risk (amber), overdue (red). */
  indicator?: KpiIndicator;
  /** When true, show empty state UI if catalog.emptyState is set. */
  isEmpty?: boolean;
  /** Comparison vs prior/budget/plan (NetSuite-style). */
  comparison?: KpiComparison;
}

export type TimeRange = 'mtd' | 'qtd' | 'ytd' | 'custom';

interface RequestContextLike {
  token?: string;
  comparisonMode?: 'vs_prior_period' | 'vs_budget' | 'vs_plan';
  timeRange?: TimeRange;
  [key: string]: unknown;
}

export type KPIResolver = (ctx: RequestContextLike) => Promise<KPIResolverResult>;

// ─── Resolvers ──────────────────────────────────────────────────────────────
// Mark KPIs as empty until wired to real APIs.
// When isEmpty=true, KPI card shows emptyState from catalog.

const EMPTY_RESULT: Omit<KPIResolverResult, 'id'> = {
  value: '—',
  formattedValue: '—',
  status: 'ok',
  isEmpty: true,
};

const PENDING_RESULT: Omit<KPIResolverResult, 'id'> = {
  value: '—',
  formattedValue: '—',
  status: 'ok',
};

/** Stub values vary by timeRange so MTD/QTD/YTD feel different (demo). */
function _byTimeRange<T>(mtd: T, qtd: T, ytd: T, range?: TimeRange): T {
  switch (range) {
    case 'qtd':
      return qtd;
    case 'ytd':
      return ytd;
    default:
      return mtd;
  }
}

function _addComparison(
  result: KPIResolverResult,
  ctx: RequestContextLike,
  prior: string,
  budget: string,
  plan: string
): KPIResolverResult {
  const mode = ctx.comparisonMode;
  if (!mode) return result;
  const label =
    mode === 'vs_prior_period' ? 'vs prior' : mode === 'vs_budget' ? 'vs budget' : 'vs plan';
  const value = mode === 'vs_prior_period' ? prior : mode === 'vs_budget' ? budget : plan;
  const trend = value.startsWith('+') ? 'up' : value.startsWith('-') ? 'down' : 'flat';
  return { ...result, comparison: { label, value, trend } };
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

/** Format minor-unit (cents) amount as currency string. */
function _fmtMoney(minor: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

/** Format a plain count number. */
function _fmtCount(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/** Build a resolved KPIResolverResult for a money value (minor units). */
function _moneyResult(id: string, minor: number, currency = 'USD'): KPIResolverResult {
  return {
    id,
    value: String(minor),
    formattedValue: _fmtMoney(minor, currency),
    status: 'ok',
    isEmpty: minor === 0,
  };
}

/** Build a resolved KPIResolverResult for a count value. */
function _countResult(id: string, count: number): KPIResolverResult {
  return {
    id,
    value: String(count),
    formattedValue: _fmtCount(count),
    status: 'ok',
    isEmpty: count === 0,
  };
}

// ─── Shared context type aliases ────────────────────────────────────────────
type DashCtx = { tenantId: string; userId: string; token: string };
type FullCtx = { tenantId: string; userId: string; token: string };

/** Safely resolve from dashboard summary (shared by fin.cash, fin.ap, fin.ar, etc.). */
async function _dashSummary(ctx: RequestContextLike) {
  const { getDashboardSummary } =
    await import('@/features/finance/dashboard/queries/dashboard.queries');
  return getDashboardSummary(ctx as DashCtx);
}

export const KPI_RESOLVERS: Record<string, KPIResolver> = {
  // ── Finance Module (Top-level KPIs) ──
  // Wired to GET /dashboard/summary
  'fin.cash': async (ctx) => {
    try {
      const r = await _dashSummary(ctx);
      if (!r.ok) return { id: 'fin.cash', ...EMPTY_RESULT };
      return _moneyResult('fin.cash', r.value.cashBalance);
    } catch {
      return { id: 'fin.cash', ...EMPTY_RESULT };
    }
  },
  'fin.ap': async (ctx) => {
    try {
      const r = await _dashSummary(ctx);
      if (!r.ok) return { id: 'fin.ap', ...EMPTY_RESULT };
      return _moneyResult('fin.ap', r.value.openAp.total);
    } catch {
      return { id: 'fin.ap', ...EMPTY_RESULT };
    }
  },
  'fin.ar': async (ctx) => {
    try {
      const r = await _dashSummary(ctx);
      if (!r.ok) return { id: 'fin.ar', ...EMPTY_RESULT };
      return _moneyResult('fin.ar', r.value.openAr.total);
    } catch {
      return { id: 'fin.ar', ...EMPTY_RESULT };
    }
  },
  // @gate-allow-stub: KPI-BACKLOG — needs income statement endpoint with period context
  'fin.pnl': async () => ({ id: 'fin.pnl', ...EMPTY_RESULT }),

  // ── Finance Domain: AP ──
  // Wired to GET /dashboard/summary → openAp
  'fin.ap.total': async (ctx) => {
    try {
      const r = await _dashSummary(ctx);
      if (!r.ok) return { id: 'fin.ap.total', ...EMPTY_RESULT };
      return _moneyResult('fin.ap.total', r.value.openAp.total);
    } catch {
      return { id: 'fin.ap.total', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /ap/aging → totals.over90
  'fin.ap.aging': async (ctx) => {
    try {
      const { getApAging } = await import('@/features/finance/reports/queries/report.queries');
      const r = await getApAging(ctx as FullCtx, {});
      if (!r.ok) return { id: 'fin.ap.aging', ...EMPTY_RESULT };
      const t = r.value.totals;
      const total = Number(BigInt(t.total));
      const buckets = [
        { label: 'Current', value: Number(BigInt(t.current)) },
        { label: '1-30', value: Number(BigInt(t.days30)) },
        { label: '31-60', value: Number(BigInt(t.days60)) },
        { label: '61-90', value: Number(BigInt(t.days90)) },
        { label: '90+', value: Number(BigInt(t.over90)) },
      ];
      return {
        id: 'fin.ap.aging',
        value: String(total),
        formattedValue: _fmtMoney(total, r.value.currency),
        status: 'ok' as const,
        isEmpty: total === 0,
        buckets,
      };
    } catch {
      return { id: 'fin.ap.aging', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /ap/aging → rows with overdue (over90 > 0) count
  'fin.ap.overdue': async (ctx) => {
    try {
      const { getApAging } = await import('@/features/finance/reports/queries/report.queries');
      const r = await getApAging(ctx as FullCtx, {});
      if (!r.ok) return { id: 'fin.ap.overdue', ...EMPTY_RESULT };
      const overdueCount = r.value.rows.filter((row) => Number(BigInt(row.over90)) > 0).length;
      return {
        ..._countResult('fin.ap.overdue', overdueCount),
        indicator: overdueCount > 0 ? ('overdue' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.ap.overdue', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /ap/invoices?status=APPROVED (pending approval count)
  'fin.ap.pending': async (ctx) => {
    try {
      const { getApInvoices } = await import('@/features/finance/payables/queries/ap.queries');
      const r = await getApInvoices(ctx as FullCtx, { status: 'APPROVED', limit: '1' });
      if (!r.ok) return { id: 'fin.ap.pending', ...EMPTY_RESULT };
      return {
        ..._countResult('fin.ap.pending', r.value.total),
        indicator: r.value.total > 5 ? ('at_risk' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.ap.pending', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /ap/discount-summary
  'fin.ap.discount': async (ctx) => {
    try {
      const { getApDiscountSummary } =
        await import('@/features/finance/payables/queries/ap.queries');
      const result = await getApDiscountSummary(ctx as FullCtx, 30);
      if (!result.ok) {
        return {
          id: 'fin.ap.discount',
          value: '0',
          formattedValue: '$0',
          status: 'ok',
          isEmpty: true,
        };
      }
      const { totalDiscount, currencyCode } = result.value;
      const minor = BigInt(totalDiscount);
      const major = Number(minor) / 100;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(major);
      return {
        id: 'fin.ap.discount',
        value: String(minor),
        formattedValue: formatted,
        status: 'ok',
        isEmpty: major === 0,
      };
    } catch {
      return {
        id: 'fin.ap.discount',
        value: '0',
        formattedValue: '$0',
        status: 'ok',
        isEmpty: true,
      };
    }
  },

  // ── Finance Domain: AR ──
  // Wired to GET /dashboard/summary → openAr
  'fin.ar.total': async (ctx) => {
    try {
      const r = await _dashSummary(ctx);
      if (!r.ok) return { id: 'fin.ar.total', ...EMPTY_RESULT };
      return _moneyResult('fin.ar.total', r.value.openAr.total);
    } catch {
      return { id: 'fin.ar.total', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /ar/aging → totals
  'fin.ar.aging': async (ctx) => {
    try {
      const { getArAging } = await import('@/features/finance/reports/queries/report.queries');
      const r = await getArAging(ctx as FullCtx, {});
      if (!r.ok) return { id: 'fin.ar.aging', ...EMPTY_RESULT };
      const t = r.value.totals;
      const total = Number(BigInt(t.total));
      const buckets = [
        { label: 'Current', value: Number(BigInt(t.current)) },
        { label: '1-30', value: Number(BigInt(t.days30)) },
        { label: '31-60', value: Number(BigInt(t.days60)) },
        { label: '61-90', value: Number(BigInt(t.days90)) },
        { label: '90+', value: Number(BigInt(t.over90)) },
      ];
      return {
        id: 'fin.ar.aging',
        value: String(total),
        formattedValue: _fmtMoney(total, r.value.currency),
        status: 'ok' as const,
        isEmpty: total === 0,
        buckets,
      };
    } catch {
      return { id: 'fin.ar.aging', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /ar/aging → rows with overdue
  'fin.ar.overdue': async (ctx) => {
    try {
      const { getArAging } = await import('@/features/finance/reports/queries/report.queries');
      const r = await getArAging(ctx as FullCtx, {});
      if (!r.ok) return { id: 'fin.ar.overdue', ...EMPTY_RESULT };
      const overdueCount = r.value.rows.filter((row) => Number(BigInt(row.over90)) > 0).length;
      return {
        ..._countResult('fin.ar.overdue', overdueCount),
        indicator: overdueCount > 0 ? ('overdue' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.ar.overdue', ...EMPTY_RESULT };
    }
  },
  // @gate-allow-stub: KPI-BACKLOG — DSO requires average calculation across periods
  'fin.ar.dso': async () => ({ id: 'fin.ar.dso', ...EMPTY_RESULT }),

  // ── Finance Domain: GL ──
  // Wired to GET /journals?status=POSTED (count MTD)
  'fin.gl.journals': async (ctx) => {
    try {
      const { getJournals } = await import('@/features/finance/journals/queries/journal.queries');
      const r = await getJournals(ctx as FullCtx, { status: 'POSTED', limit: '1' });
      if (!r.ok) return { id: 'fin.gl.journals', ...EMPTY_RESULT };
      return _countResult('fin.gl.journals', r.value.total);
    } catch {
      return { id: 'fin.gl.journals', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /journals?status=DRAFT (unposted count)
  'fin.gl.unposted': async (ctx) => {
    try {
      const { getJournals } = await import('@/features/finance/journals/queries/journal.queries');
      const r = await getJournals(ctx as FullCtx, { status: 'DRAFT', limit: '1' });
      if (!r.ok) return { id: 'fin.gl.unposted', ...EMPTY_RESULT };
      return {
        ..._countResult('fin.gl.unposted', r.value.total),
        indicator: r.value.total > 0 ? ('at_risk' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.gl.unposted', ...EMPTY_RESULT };
    }
  },
  // @gate-allow-stub: KPI-BACKLOG — trial balance requires ledgerId + period context
  'fin.gl.trialBalance': async () => ({ id: 'fin.gl.trialBalance', ...EMPTY_RESULT }),

  // ── Finance Domain: Banking ──
  // Wired to GET /dashboard/summary → cashBalance
  'fin.bank.balance': async (ctx) => {
    try {
      const r = await _dashSummary(ctx);
      if (!r.ok) return { id: 'fin.bank.balance', ...EMPTY_RESULT };
      return _moneyResult('fin.bank.balance', r.value.cashBalance);
    } catch {
      return { id: 'fin.bank.balance', ...EMPTY_RESULT };
    }
  },
  // @gate-allow-stub: KPI-BACKLOG — needs bank recon summary endpoint
  'fin.bank.unreconciled': async () => ({ id: 'fin.bank.unreconciled', ...EMPTY_RESULT }),

  // ── Finance Domain: Asset Accounting ──
  // Wired to GET /reports/asset-register → totalNBV
  'fin.aa.totalAssets': async (ctx) => {
    try {
      const { getAssetRegister } =
        await import('@/features/finance/reports/queries/report.queries');
      const r = await getAssetRegister(ctx as FullCtx, {});
      if (!r.ok) return { id: 'fin.aa.totalAssets', ...EMPTY_RESULT };
      const nbv = Number(BigInt(r.value.totalNBV));
      return _moneyResult('fin.aa.totalAssets', nbv, r.value.currency);
    } catch {
      return { id: 'fin.aa.totalAssets', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /reports/asset-register → totalDepreciation
  'fin.aa.depreciation': async (ctx) => {
    try {
      const { getAssetRegister } =
        await import('@/features/finance/reports/queries/report.queries');
      const r = await getAssetRegister(ctx as FullCtx, {});
      if (!r.ok) return { id: 'fin.aa.depreciation', ...EMPTY_RESULT };
      const dep = Number(BigInt(r.value.totalDepreciation));
      return _moneyResult('fin.aa.depreciation', dep, r.value.currency);
    } catch {
      return { id: 'fin.aa.depreciation', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /fixed-assets → filter status=PENDING_DISPOSAL
  'fin.aa.disposals': async (ctx) => {
    try {
      const { createApiClient } = await import('@/lib/api-client');
      const client = createApiClient(ctx as FullCtx);
      const r = await client.get<{ data: Array<{ status: string }> }>('/fixed-assets');
      if (!r.ok) return { id: 'fin.aa.disposals', ...EMPTY_RESULT };
      const pending = r.value.data.filter((a) => a.status === 'PENDING_DISPOSAL').length;
      return _countResult('fin.aa.disposals', pending);
    } catch {
      return { id: 'fin.aa.disposals', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: Travel & Expenses ──
  // Wired to GET /expense-claims/summary
  'fin.tv.openClaims': async (ctx) => {
    try {
      const { getExpenseSummary } =
        await import('@/features/finance/expenses/queries/expenses.queries');
      const r = await getExpenseSummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.tv.openClaims', ...EMPTY_RESULT };
      return _countResult('fin.tv.openClaims', r.value.totalClaims - r.value.paidThisMonth);
    } catch {
      return { id: 'fin.tv.openClaims', ...EMPTY_RESULT };
    }
  },
  'fin.tv.pendingApproval': async (ctx) => {
    try {
      const { getExpenseSummary } =
        await import('@/features/finance/expenses/queries/expenses.queries');
      const r = await getExpenseSummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.tv.pendingApproval', ...EMPTY_RESULT };
      return {
        ..._countResult('fin.tv.pendingApproval', r.value.pendingClaims),
        indicator: r.value.pendingClaims > 10 ? ('at_risk' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.tv.pendingApproval', ...EMPTY_RESULT };
    }
  },
  'fin.tv.totalExpenses': async (ctx) => {
    try {
      const { getExpenseSummary } =
        await import('@/features/finance/expenses/queries/expenses.queries');
      const r = await getExpenseSummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.tv.totalExpenses', ...EMPTY_RESULT };
      return _moneyResult('fin.tv.totalExpenses', r.value.approvedAmount);
    } catch {
      return { id: 'fin.tv.totalExpenses', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: Treasury ──
  // Wired to GET /treasury/summary
  'fin.tr.cashForecast': async (ctx) => {
    try {
      const { getTreasurySummary } =
        await import('@/features/finance/treasury/queries/treasury.queries');
      const r = await getTreasurySummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.tr.cashForecast', ...EMPTY_RESULT };
      return _moneyResult('fin.tr.cashForecast', r.value.forecastedEndOfMonth);
    } catch {
      return { id: 'fin.tr.cashForecast', ...EMPTY_RESULT };
    }
  },
  'fin.tr.activeLoans': async (ctx) => {
    try {
      const { getTreasurySummary } =
        await import('@/features/finance/treasury/queries/treasury.queries');
      const r = await getTreasurySummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.tr.activeLoans', ...EMPTY_RESULT };
      return _countResult('fin.tr.activeLoans', r.value.activeLoans);
    } catch {
      return { id: 'fin.tr.activeLoans', ...EMPTY_RESULT };
    }
  },
  'fin.tr.covenantBreaches': async (ctx) => {
    try {
      const { getTreasurySummary } =
        await import('@/features/finance/treasury/queries/treasury.queries');
      const r = await getTreasurySummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.tr.covenantBreaches', ...EMPTY_RESULT };
      return {
        ..._countResult('fin.tr.covenantBreaches', r.value.covenantsBreeched),
        indicator: r.value.covenantsBreeched > 0 ? ('overdue' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.tr.covenantBreaches', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: Controlling ──
  // Wired to GET /cost-allocation report for cost center data
  'fin.co.costCenters': async (ctx) => {
    try {
      const { createApiClient } = await import('@/lib/api-client');
      const client = createApiClient(ctx as FullCtx);
      const r = await client.get<{ data: Array<{ status: string }> }>('/cost-centers');
      if (!r.ok) return { id: 'fin.co.costCenters', ...EMPTY_RESULT };
      const active = r.value.data.filter((c) => c.status === 'ACTIVE').length;
      return _countResult('fin.co.costCenters', active);
    } catch {
      return { id: 'fin.co.costCenters', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /projects (list with count)
  'fin.co.projects': async (ctx) => {
    try {
      const { createApiClient } = await import('@/lib/api-client');
      const client = createApiClient(ctx as FullCtx);
      const r = await client.get<{ data: Array<{ status: string }> }>('/projects');
      if (!r.ok) return { id: 'fin.co.projects', ...EMPTY_RESULT };
      const active = r.value.data.filter((p) => p.status === 'ACTIVE').length;
      return _countResult('fin.co.projects', active);
    } catch {
      return { id: 'fin.co.projects', ...EMPTY_RESULT };
    }
  },
  // @gate-allow-stub: KPI-BACKLOG — needs allocation run history endpoint
  'fin.co.allocations': async () => ({ id: 'fin.co.allocations', ...EMPTY_RESULT }),
  // @gate-allow-stub: KPI-BACKLOG — needs budget variance with period context
  'fin.co.variance': async () => ({ id: 'fin.co.variance', ...EMPTY_RESULT }),

  // ── Finance Domain: Tax & Compliance ──
  // Wired to GET /tax/codes?status=active
  'fin.tx.activeCodes': async (ctx) => {
    try {
      const { getTaxCodes } = await import('@/features/finance/tax/queries/tax.queries');
      const r = await getTaxCodes(ctx as FullCtx, { status: 'active' });
      if (!r.ok) return { id: 'fin.tx.activeCodes', ...EMPTY_RESULT };
      return _countResult('fin.tx.activeCodes', r.data.length);
    } catch {
      return { id: 'fin.tx.activeCodes', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /tax/returns?status=PENDING
  'fin.tx.pendingReturns': async (ctx) => {
    try {
      const { getTaxReturnPeriods } = await import('@/features/finance/tax/queries/tax.queries');
      const r = await getTaxReturnPeriods(ctx as FullCtx, { status: 'PENDING' });
      if (!r.ok) return { id: 'fin.tx.pendingReturns', ...EMPTY_RESULT };
      return {
        ..._countResult('fin.tx.pendingReturns', r.data.length),
        indicator: r.data.length > 0 ? ('at_risk' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.tx.pendingReturns', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /tax/wht-certificates
  'fin.tx.whtCerts': async (ctx) => {
    try {
      const { getWHTCertificates } = await import('@/features/finance/tax/queries/tax.queries');
      const r = await getWHTCertificates(ctx as FullCtx);
      if (!r.ok) return { id: 'fin.tx.whtCerts', ...EMPTY_RESULT };
      return _countResult('fin.tx.whtCerts', r.data.length);
    } catch {
      return { id: 'fin.tx.whtCerts', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: Intercompany ──
  // Wired to GET /ic-transactions?status=OPEN
  'fin.ic.openTx': async (ctx) => {
    try {
      const { getIcTransactions } =
        await import('@/features/finance/intercompany/queries/ic.queries');
      const r = await getIcTransactions(ctx as FullCtx, { status: 'OPEN', limit: '1' });
      if (!r.ok) return { id: 'fin.ic.openTx', ...EMPTY_RESULT };
      return _countResult('fin.ic.openTx', r.value.total);
    } catch {
      return { id: 'fin.ic.openTx', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /reports/ic-aging
  'fin.ic.aging': async (ctx) => {
    try {
      const { getIcAging } = await import('@/features/finance/intercompany/queries/ic.queries');
      const r = await getIcAging(ctx as FullCtx, {});
      if (!r.ok) return { id: 'fin.ic.aging', ...EMPTY_RESULT };
      const total = Number(BigInt(r.value.grandTotal));
      return _moneyResult('fin.ic.aging', total, r.value.currency);
    } catch {
      return { id: 'fin.ic.aging', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /tp-policies/summary → activePolicies
  'fin.ic.tpPolicies': async (ctx) => {
    try {
      const { getTransferPricingSummary } =
        await import('@/features/finance/transfer-pricing/queries/transfer-pricing.queries');
      const r = await getTransferPricingSummary(ctx as FullCtx);
      if (!r.ok) return { id: 'fin.ic.tpPolicies', ...EMPTY_RESULT };
      return _countResult('fin.ic.tpPolicies', r.value.activePolicies);
    } catch {
      return { id: 'fin.ic.tpPolicies', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: IFRS & Standards ──
  // Wired to GET /leases/summary → activeLeases
  'fin.ifrs.activeLeases': async (ctx) => {
    try {
      const { getLeaseSummary } = await import('@/features/finance/leases/queries/leases.queries');
      const r = await getLeaseSummary(ctx as FullCtx);
      if (!r.ok) return { id: 'fin.ifrs.activeLeases', ...EMPTY_RESULT };
      return _countResult('fin.ifrs.activeLeases', r.data.activeLeases);
    } catch {
      return { id: 'fin.ifrs.activeLeases', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /provisions/summary → activeProvisions
  'fin.ifrs.provisions': async (ctx) => {
    try {
      const { getProvisionSummary } =
        await import('@/features/finance/provisions/queries/provisions.queries');
      const r = await getProvisionSummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.ifrs.provisions', ...EMPTY_RESULT };
      return _countResult('fin.ifrs.provisions', r.value.activeProvisions);
    } catch {
      return { id: 'fin.ifrs.provisions', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /fin-instruments/summary → totalInstruments
  'fin.ifrs.instruments': async (ctx) => {
    try {
      const { getInstrumentSummary } =
        await import('@/features/finance/instruments/queries/instruments.queries');
      const r = await getInstrumentSummary(ctx as DashCtx);
      if (!r.ok) return { id: 'fin.ifrs.instruments', ...EMPTY_RESULT };
      return _countResult('fin.ifrs.instruments', r.value.totalInstruments);
    } catch {
      return { id: 'fin.ifrs.instruments', ...EMPTY_RESULT };
    }
  },
  // Wired to GET /hedge-relationships/summary → activeRelationships
  'fin.ifrs.hedges': async (ctx) => {
    try {
      const { getHedgingSummary } =
        await import('@/features/finance/hedging/queries/hedging.queries');
      const r = await getHedgingSummary(ctx as FullCtx);
      if (!r.ok) return { id: 'fin.ifrs.hedges', ...EMPTY_RESULT };
      return _countResult('fin.ifrs.hedges', r.value.activeRelationships);
    } catch {
      return { id: 'fin.ifrs.hedges', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: Consolidation ──
  // Wired to GET /group-entities/summary
  'fin.lc.entities': async (ctx) => {
    try {
      const { getConsolidationSummary } =
        await import('@/features/finance/consolidation/queries/consolidation.queries');
      const r = await getConsolidationSummary(ctx as FullCtx);
      if (!r.ok) return { id: 'fin.lc.entities', ...EMPTY_RESULT };
      return _countResult('fin.lc.entities', r.value.totalEntities);
    } catch {
      return { id: 'fin.lc.entities', ...EMPTY_RESULT };
    }
  },
  'fin.lc.eliminations': async (ctx) => {
    try {
      const { getConsolidationSummary } =
        await import('@/features/finance/consolidation/queries/consolidation.queries');
      const r = await getConsolidationSummary(ctx as FullCtx);
      if (!r.ok) return { id: 'fin.lc.eliminations', ...EMPTY_RESULT };
      return {
        ..._countResult('fin.lc.eliminations', r.value.eliminationEntries),
        indicator: r.value.eliminationEntries > 0 ? ('at_risk' as const) : ('on_track' as const),
      };
    } catch {
      return { id: 'fin.lc.eliminations', ...EMPTY_RESULT };
    }
  },
  'fin.lc.goodwill': async (ctx) => {
    try {
      const { getConsolidationSummary } =
        await import('@/features/finance/consolidation/queries/consolidation.queries');
      const r = await getConsolidationSummary(ctx as FullCtx);
      if (!r.ok) return { id: 'fin.lc.goodwill', ...EMPTY_RESULT };
      return _moneyResult('fin.lc.goodwill', r.value.totalGoodwill);
    } catch {
      return { id: 'fin.lc.goodwill', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: Settings ──
  // Wired to GET /ap/match-tolerances (count)
  'fin.cfg.paymentTerms': async (ctx) => {
    try {
      const { createApiClient } = await import('@/lib/api-client');
      const client = createApiClient(ctx as FullCtx);
      const r = await client.get<{ data: unknown[] }>('/payment-terms');
      if (!r.ok) return { id: 'fin.cfg.paymentTerms', ...EMPTY_RESULT };
      return _countResult('fin.cfg.paymentTerms', r.value.data.length);
    } catch {
      return { id: 'fin.cfg.paymentTerms', ...EMPTY_RESULT };
    }
  },
  'fin.cfg.matchRules': async (ctx) => {
    try {
      const { createApiClient } = await import('@/lib/api-client');
      const client = createApiClient(ctx as FullCtx);
      const r = await client.get<unknown[]>('/ap/match-tolerances');
      if (!r.ok) return { id: 'fin.cfg.matchRules', ...EMPTY_RESULT };
      return _countResult('fin.cfg.matchRules', r.value.length);
    } catch {
      return { id: 'fin.cfg.matchRules', ...EMPTY_RESULT };
    }
  },

  // ── Finance Domain: Reports ──
  // @gate-allow-stub: KPI-BACKLOG — reports require ledgerId + period context from tenant
  'fin.rp.balanceSheet': async () => ({ id: 'fin.rp.balanceSheet', ...PENDING_RESULT }),
  // @gate-allow-stub: KPI-BACKLOG — reports require ledgerId + period context from tenant
  'fin.rp.incomeStmt': async () => ({ id: 'fin.rp.incomeStmt', ...PENDING_RESULT }),
  // @gate-allow-stub: KPI-BACKLOG — reports require ledgerId + period context from tenant
  'fin.rp.cashFlow': async () => ({ id: 'fin.rp.cashFlow', ...PENDING_RESULT }),

  // ── Home ──
  // Wired to GET /dashboard/summary → recentActivity count
  'home.activity': async (ctx) => {
    try {
      const r = await _dashSummary(ctx);
      if (!r.ok) return { id: 'home.activity', ...EMPTY_RESULT };
      return _countResult('home.activity', r.value.recentActivity.length);
    } catch {
      return { id: 'home.activity', ...EMPTY_RESULT };
    }
  },

  // ── Admin ──
  // @gate-allow-stub: KPI-BACKLOG — needs kernel admin API
  'admin.tenants': async () => ({ id: 'admin.tenants', ...EMPTY_RESULT }),
  'admin.users': async () => ({ id: 'admin.users', ...EMPTY_RESULT }),

  // ── Pending (Coming Soon) ──
  'stub.comingSoon': async () => ({
    ...PENDING_RESULT,
    id: 'stub.comingSoon',
  }),
};

// ─── Resolver Execution ─────────────────────────────────────────────────────
// Locked error contract (AD-DASH-04):
// - Resolver throws → stub with status: 'error', logged server-side
// - Resolver returns null → stub
// - sparklineData bounded to 20 points
// - Dashboard never breaks the shell
//
// Wrapped with React cache() for automatic request memoization (RBP-CACHE).
// Multiple components requesting the same KPIs get cached results.

const MAX_SPARKLINE_POINTS = 20;

export const resolveKPIs = cache(
  async (
    ids: string[],
    ctx: RequestContextLike,
    options?: {
      comparisonMode?: 'vs_prior_period' | 'vs_budget' | 'vs_plan';
      timeRange?: TimeRange;
    }
  ): Promise<KPIResolverResult[]> => {
    const resolvedCtx: RequestContextLike = {
      ...ctx,
      comparisonMode: options?.comparisonMode ?? ctx.comparisonMode,
      timeRange: options?.timeRange ?? ctx.timeRange ?? 'mtd',
    };
    const results = await Promise.allSettled(
      ids.map((id) => {
        const resolver = KPI_RESOLVERS[id];
        if (!resolver) {
          return Promise.resolve<KPIResolverResult>({
            id,
            value: '—',
            formattedValue: '—',
            status: 'error',
          });
        }
        return resolver(resolvedCtx).catch((err: unknown): KPIResolverResult => {
          console.error(`[KPI] Resolver failed: ${id}`, err);
          return {
            id,
            value: '—',
            formattedValue: '—',
            status: 'error',
          };
        });
      })
    );

    return results.map((r, i): KPIResolverResult => {
      if (r.status !== 'fulfilled' || !r.value) {
        return {
          id: ids[i] ?? '?',
          value: '—',
          formattedValue: '—',
          status: 'error',
        };
      }

      const result = r.value;

      // Enforce sparkline bounds
      if (result.sparklineData && result.sparklineData.length > MAX_SPARKLINE_POINTS) {
        result.sparklineData = result.sparklineData.slice(-MAX_SPARKLINE_POINTS);
      }

      return result;
    });
  }
);
