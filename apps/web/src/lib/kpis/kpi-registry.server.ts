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

const STUB_RESULT: Omit<KPIResolverResult, 'id'> = {
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
  plan: string,
): KPIResolverResult {
  const mode = ctx.comparisonMode;
  if (!mode) return result;
  const label =
    mode === 'vs_prior_period'
      ? 'vs prior'
      : mode === 'vs_budget'
        ? 'vs budget'
        : 'vs plan';
  const value =
    mode === 'vs_prior_period' ? prior : mode === 'vs_budget' ? budget : plan;
  const trend = value.startsWith('+') ? 'up' : value.startsWith('-') ? 'down' : 'flat';
  return { ...result, comparison: { label, value, trend } };
}

export const KPI_RESOLVERS: Record<string, KPIResolver> = {
  // ── Finance Module (Top-level KPIs) ──
  // TODO: Wire to real API endpoints when ready
  'fin.cash': async () => ({ id: 'fin.cash', ...EMPTY_RESULT }),
  'fin.ap': async () => ({ id: 'fin.ap', ...EMPTY_RESULT }),
  'fin.ar': async () => ({ id: 'fin.ar', ...EMPTY_RESULT }),
  'fin.pnl': async () => ({ id: 'fin.pnl', ...EMPTY_RESULT }),

  // ── Finance Domain: AP ──
  'fin.ap.total': async () => ({ id: 'fin.ap.total', ...EMPTY_RESULT }),
  'fin.ap.aging': async () => ({ id: 'fin.ap.aging', ...EMPTY_RESULT }),
  'fin.ap.overdue': async () => ({ id: 'fin.ap.overdue', ...EMPTY_RESULT }),
  'fin.ap.pending': async () => ({ id: 'fin.ap.pending', ...EMPTY_RESULT }),
  // Real implementation - keep as-is
  'fin.ap.discount': async (ctx) => {
    try {
      const { getApDiscountSummary } = await import('@/features/finance/payables/queries/ap.queries');
      const result = await getApDiscountSummary(ctx as { tenantId: string; userId: string; token: string }, 30);
      if (!result.ok) {
        return { id: 'fin.ap.discount', value: '0', formattedValue: '$0', status: 'ok', isEmpty: true };
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
      return { id: 'fin.ap.discount', value: '0', formattedValue: '$0', status: 'ok', isEmpty: true };
    }
  },

  // ── Finance Domain: AR ──
  'fin.ar.total': async () => ({ id: 'fin.ar.total', ...EMPTY_RESULT }),
  'fin.ar.aging': async () => ({ id: 'fin.ar.aging', ...EMPTY_RESULT }),
  'fin.ar.overdue': async () => ({ id: 'fin.ar.overdue', ...EMPTY_RESULT }),
  'fin.ar.dso': async () => ({ id: 'fin.ar.dso', ...EMPTY_RESULT }),

  // ── Finance Domain: GL ──
  'fin.gl.journals': async () => ({ id: 'fin.gl.journals', ...EMPTY_RESULT }),
  'fin.gl.unposted': async () => ({ id: 'fin.gl.unposted', ...EMPTY_RESULT }),
  'fin.gl.trialBalance': async () => ({ id: 'fin.gl.trialBalance', ...EMPTY_RESULT }),

  // ── Finance Domain: Banking ──
  'fin.bank.balance': async () => ({ id: 'fin.bank.balance', ...EMPTY_RESULT }),
  'fin.bank.unreconciled': async () => ({ id: 'fin.bank.unreconciled', ...EMPTY_RESULT }),

  // ── Finance Domain: Asset Accounting ──
  'fin.aa.totalAssets': async () => ({ id: 'fin.aa.totalAssets', ...EMPTY_RESULT }),
  'fin.aa.depreciation': async () => ({ id: 'fin.aa.depreciation', ...EMPTY_RESULT }),
  'fin.aa.disposals': async () => ({ id: 'fin.aa.disposals', ...EMPTY_RESULT }),

  // ── Finance Domain: Travel & Expenses ──
  'fin.tv.openClaims': async () => ({ id: 'fin.tv.openClaims', ...EMPTY_RESULT }),
  'fin.tv.pendingApproval': async () => ({ id: 'fin.tv.pendingApproval', ...EMPTY_RESULT }),
  'fin.tv.totalExpenses': async () => ({ id: 'fin.tv.totalExpenses', ...EMPTY_RESULT }),

  // ── Finance Domain: Treasury ──
  'fin.tr.cashForecast': async () => ({ id: 'fin.tr.cashForecast', ...EMPTY_RESULT }),
  'fin.tr.activeLoans': async () => ({ id: 'fin.tr.activeLoans', ...EMPTY_RESULT }),
  'fin.tr.covenantBreaches': async () => ({ id: 'fin.tr.covenantBreaches', ...EMPTY_RESULT }),

  // ── Finance Domain: Controlling ──
  'fin.co.costCenters': async () => ({ id: 'fin.co.costCenters', ...EMPTY_RESULT }),
  'fin.co.projects': async () => ({ id: 'fin.co.projects', ...EMPTY_RESULT }),
  'fin.co.allocations': async () => ({ id: 'fin.co.allocations', ...EMPTY_RESULT }),
  'fin.co.variance': async () => ({ id: 'fin.co.variance', ...EMPTY_RESULT }),

  // ── Finance Domain: Tax & Compliance ──
  'fin.tx.activeCodes': async () => ({ id: 'fin.tx.activeCodes', ...EMPTY_RESULT }),
  'fin.tx.pendingReturns': async () => ({ id: 'fin.tx.pendingReturns', ...EMPTY_RESULT }),
  'fin.tx.whtCerts': async () => ({ id: 'fin.tx.whtCerts', ...EMPTY_RESULT }),

  // ── Finance Domain: Intercompany ──
  'fin.ic.openTx': async () => ({ id: 'fin.ic.openTx', ...EMPTY_RESULT }),
  'fin.ic.aging': async () => ({ id: 'fin.ic.aging', ...EMPTY_RESULT }),
  'fin.ic.tpPolicies': async () => ({ id: 'fin.ic.tpPolicies', ...EMPTY_RESULT }),

  // ── Finance Domain: IFRS & Standards ──
  'fin.ifrs.activeLeases': async () => ({ id: 'fin.ifrs.activeLeases', ...EMPTY_RESULT }),
  'fin.ifrs.provisions': async () => ({ id: 'fin.ifrs.provisions', ...EMPTY_RESULT }),
  'fin.ifrs.instruments': async () => ({ id: 'fin.ifrs.instruments', ...EMPTY_RESULT }),
  'fin.ifrs.hedges': async () => ({ id: 'fin.ifrs.hedges', ...EMPTY_RESULT }),

  // ── Finance Domain: Consolidation ──
  'fin.lc.entities': async () => ({ id: 'fin.lc.entities', ...EMPTY_RESULT }),
  'fin.lc.eliminations': async () => ({ id: 'fin.lc.eliminations', ...EMPTY_RESULT }),
  'fin.lc.goodwill': async () => ({ id: 'fin.lc.goodwill', ...EMPTY_RESULT }),

  // ── Finance Domain: Settings ──
  'fin.cfg.paymentTerms': async () => ({ id: 'fin.cfg.paymentTerms', ...EMPTY_RESULT }),
  'fin.cfg.matchRules': async () => ({ id: 'fin.cfg.matchRules', ...EMPTY_RESULT }),

  // ── Finance Domain: Reports ──
  'fin.rp.balanceSheet': async () => ({ id: 'fin.rp.balanceSheet', ...STUB_RESULT }),
  'fin.rp.incomeStmt': async () => ({ id: 'fin.rp.incomeStmt', ...STUB_RESULT }),
  'fin.rp.cashFlow': async () => ({ id: 'fin.rp.cashFlow', ...STUB_RESULT }),

  // ── Home ──
  'home.activity': async () => ({ id: 'home.activity', ...EMPTY_RESULT }),

  // ── Admin ──
  'admin.tenants': async () => ({ id: 'admin.tenants', ...EMPTY_RESULT }),
  'admin.users': async () => ({ id: 'admin.users', ...EMPTY_RESULT }),

  // ── Stub (Coming Soon) ──
  'stub.comingSoon': async () => ({
    ...STUB_RESULT,
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
