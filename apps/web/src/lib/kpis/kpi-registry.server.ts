// ─── KPI Resolver Types ─────────────────────────────────────────────────────
// Raw metrics only — no 'template' (that's in the catalog).
// Server-only file: NEVER import from client code.

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

interface RequestContextLike {
  token?: string;
  comparisonMode?: 'vs_prior_period' | 'vs_budget' | 'vs_plan';
  [key: string]: unknown;
}

export type KPIResolver = (ctx: RequestContextLike) => Promise<KPIResolverResult>;

// ─── Resolvers ──────────────────────────────────────────────────────────────
// All resolvers return placeholder data for now.
// Wire to real DB via createApiClient(ctx) when backends are ready.

const STUB_RESULT: KPIResolverResult = {
  id: 'stub',
  value: '—',
  formattedValue: '—',
  status: 'ok',
};

function addComparison(
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
  // ── Finance Module ──
  'fin.cash': async (ctx) =>
    addComparison(
      {
        id: 'fin.cash',
        value: '1250000',
        formattedValue: '$1,250,000',
        trend: 'up',
        trendValue: '+3.2%',
        status: 'ok',
        indicator: 'on_track',
        sparklineData: [1100, 1150, 1180, 1200, 1220, 1240, 1250],
      },
      ctx,
      '+3.2%',
      '+2.1%',
      '+1.8%',
    ),
  'fin.ap': async (ctx) =>
    addComparison(
      {
        id: 'fin.ap',
        value: '340000',
        formattedValue: '$340,000',
        trend: 'down',
        trendValue: '-5.1%',
        status: 'ok',
        indicator: 'at_risk',
        sparklineData: [360, 355, 350, 348, 345, 342, 340],
      },
      ctx,
      '-5.1%',
      '-2.0%',
      '-1.5%',
    ),
  'fin.ar': async (ctx) =>
    addComparison(
      {
        id: 'fin.ar',
        value: '520000',
        formattedValue: '$520,000',
        trend: 'up',
        trendValue: '+2.8%',
        status: 'ok',
        indicator: 'on_track',
        sparklineData: [480, 495, 505, 510, 515, 518, 520],
      },
      ctx,
      '+2.8%',
      '+4.0%',
      '+3.2%',
    ),
  'fin.pnl': async () => ({
    id: 'fin.pnl',
    value: '85000',
    formattedValue: '$85,000',
    trend: 'up',
    trendValue: '+12.4%',
    status: 'ok',
  }),

  // ── Finance Domain: AP ──
  'fin.ap.total': async (ctx) =>
    addComparison(
      {
        id: 'fin.ap.total',
        value: '340000',
        formattedValue: '$340,000',
        trend: 'down',
        trendValue: '-5.1%',
        status: 'ok',
        indicator: 'at_risk',
        sparklineData: [360, 355, 350, 348, 345, 342, 340],
      },
      ctx,
      '-5.1%',
      '-2.0%',
      '-1.5%',
    ),
  'fin.ap.aging': async () => ({
    id: 'fin.ap.aging',
    value: '340000',
    formattedValue: '$340,000',
    buckets: [
      { label: 'Current', value: 180000 },
      { label: '1-30', value: 80000 },
      { label: '31-60', value: 50000 },
      { label: '61-90', value: 20000 },
      { label: '90+', value: 10000 },
    ],
    status: 'ok',
  }),
  'fin.ap.overdue': async () => ({
    id: 'fin.ap.overdue',
    value: '12',
    formattedValue: '12',
    status: 'ok',
    indicator: 'overdue',
  }),
  'fin.ap.pending': async () => ({
    id: 'fin.ap.pending',
    value: '5',
    formattedValue: '5',
    status: 'ok',
  }),
  'fin.ap.discount': async (ctx) => {
    try {
      const { getApDiscountSummary } = await import('@/features/finance/payables/queries/ap.queries');
      const result = await getApDiscountSummary(ctx as { tenantId: string; userId: string; token: string }, 30);
      if (!result.ok) {
        return { id: 'fin.ap.discount', value: '0', formattedValue: '$0', status: 'ok' };
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
      };
    } catch {
      return { id: 'fin.ap.discount', value: '0', formattedValue: '$0', status: 'ok' };
    }
  },

  // ── Finance Domain: AR ──
  'fin.ar.total': async () => ({
    id: 'fin.ar.total',
    value: '520000',
    formattedValue: '$520,000',
    trend: 'up',
    trendValue: '+2.8%',
    status: 'ok',
    indicator: 'on_track',
    sparklineData: [480, 495, 505, 510, 515, 518, 520],
  }),
  'fin.ar.aging': async () => ({
    id: 'fin.ar.aging',
    value: '520000',
    formattedValue: '$520,000',
    buckets: [
      { label: 'Current', value: 300000 },
      { label: '1-30', value: 120000 },
      { label: '31-60', value: 60000 },
      { label: '61-90', value: 30000 },
      { label: '90+', value: 10000 },
    ],
    status: 'ok',
  }),
  'fin.ar.overdue': async () => ({
    id: 'fin.ar.overdue',
    value: '8',
    formattedValue: '8',
    status: 'ok',
  }),
  'fin.ar.dso': async () => ({
    id: 'fin.ar.dso',
    value: '42',
    formattedValue: '42 days',
    trend: 'down',
    trendValue: '-3 days',
    status: 'ok',
  }),

  // ── Finance Domain: GL ──
  'fin.gl.journals': async () => ({
    id: 'fin.gl.journals',
    value: '156',
    formattedValue: '156',
    status: 'ok',
  }),
  'fin.gl.unposted': async () => ({
    id: 'fin.gl.unposted',
    value: '3',
    formattedValue: '3',
    status: 'ok',
  }),
  'fin.gl.trialBalance': async () => ({
    id: 'fin.gl.trialBalance',
    value: '0',
    formattedValue: '$0',
    trend: 'flat',
    trendValue: 'Balanced',
    status: 'ok',
  }),

  // ── Finance Domain: Banking ──
  'fin.bank.balance': async () => ({
    id: 'fin.bank.balance',
    value: '1250000',
    formattedValue: '$1,250,000',
    trend: 'up',
    trendValue: '+3.2%',
    status: 'ok',
    indicator: 'on_track',
    sparklineData: [1100, 1150, 1180, 1200, 1220, 1240, 1250],
  }),
  'fin.bank.unreconciled': async () => ({
    id: 'fin.bank.unreconciled',
    value: '14',
    formattedValue: '14',
    status: 'ok',
  }),

  // ── Finance Domain: Asset Accounting ──
  'fin.aa.totalAssets': async () => ({
    id: 'fin.aa.totalAssets',
    value: '4800000',
    formattedValue: '$4,800,000',
    trend: 'down',
    trendValue: '-1.2%',
    status: 'ok',
  }),
  'fin.aa.depreciation': async () => ({
    id: 'fin.aa.depreciation',
    value: '42000',
    formattedValue: '$42,000',
    trend: 'flat',
    trendValue: '0%',
    status: 'ok',
  }),
  'fin.aa.disposals': async () => ({
    id: 'fin.aa.disposals',
    value: '2',
    formattedValue: '2',
    status: 'ok',
  }),

  // ── Finance Domain: Travel & Expenses ──
  'fin.tv.openClaims': async () => ({
    id: 'fin.tv.openClaims',
    value: '17',
    formattedValue: '17',
    status: 'ok',
  }),
  'fin.tv.pendingApproval': async () => ({
    id: 'fin.tv.pendingApproval',
    value: '6',
    formattedValue: '6',
    status: 'ok',
  }),
  'fin.tv.totalExpenses': async () => ({
    id: 'fin.tv.totalExpenses',
    value: '28500',
    formattedValue: '$28,500',
    trend: 'up',
    trendValue: '+8.3%',
    status: 'ok',
  }),

  // ── Finance Domain: Treasury ──
  'fin.tr.cashForecast': async () => ({
    id: 'fin.tr.cashForecast',
    value: '2100000',
    formattedValue: '$2,100,000',
    trend: 'up',
    trendValue: '+5.6%',
    status: 'ok',
  }),
  'fin.tr.activeLoans': async () => ({
    id: 'fin.tr.activeLoans',
    value: '3',
    formattedValue: '3',
    status: 'ok',
  }),
  'fin.tr.covenantBreaches': async () => ({
    id: 'fin.tr.covenantBreaches',
    value: '0',
    formattedValue: '0',
    status: 'ok',
  }),

  // ── Finance Domain: Controlling ──
  'fin.co.costCenters': async () => ({
    id: 'fin.co.costCenters',
    value: '24',
    formattedValue: '24',
    status: 'ok',
  }),
  'fin.co.projects': async () => ({
    id: 'fin.co.projects',
    value: '12',
    formattedValue: '12',
    status: 'ok',
  }),
  'fin.co.allocations': async () => ({
    id: 'fin.co.allocations',
    value: '3',
    formattedValue: '3',
    status: 'ok',
  }),
  'fin.co.variance': async () => ({
    id: 'fin.co.variance',
    value: '4.2',
    formattedValue: '4.2%',
    trend: 'up',
    trendValue: '+1.1%',
    status: 'ok',
  }),

  // ── Finance Domain: Tax & Compliance ──
  'fin.tx.activeCodes': async () => ({
    id: 'fin.tx.activeCodes',
    value: '38',
    formattedValue: '38',
    status: 'ok',
  }),
  'fin.tx.pendingReturns': async () => ({
    id: 'fin.tx.pendingReturns',
    value: '2',
    formattedValue: '2',
    status: 'ok',
  }),
  'fin.tx.whtCerts': async () => ({
    id: 'fin.tx.whtCerts',
    value: '15',
    formattedValue: '15',
    status: 'ok',
  }),

  // ── Finance Domain: Intercompany ──
  'fin.ic.openTx': async () => ({
    id: 'fin.ic.openTx',
    value: '7',
    formattedValue: '7',
    status: 'ok',
  }),
  'fin.ic.aging': async () => ({
    id: 'fin.ic.aging',
    value: '145000',
    formattedValue: '$145,000',
    buckets: [
      { label: 'Current', value: 80000 },
      { label: '1-30', value: 35000 },
      { label: '31-60', value: 20000 },
      { label: '61-90', value: 10000 },
    ],
    status: 'ok',
  }),
  'fin.ic.tpPolicies': async () => ({
    id: 'fin.ic.tpPolicies',
    value: '4',
    formattedValue: '4',
    status: 'ok',
  }),

  // ── Finance Domain: IFRS & Standards ──
  'fin.ifrs.activeLeases': async () => ({
    id: 'fin.ifrs.activeLeases',
    value: '22',
    formattedValue: '22',
    status: 'ok',
  }),
  'fin.ifrs.provisions': async () => ({
    id: 'fin.ifrs.provisions',
    value: '5',
    formattedValue: '5',
    status: 'ok',
  }),
  'fin.ifrs.instruments': async () => ({
    id: 'fin.ifrs.instruments',
    value: '9',
    formattedValue: '9',
    status: 'ok',
  }),
  'fin.ifrs.hedges': async () => ({
    id: 'fin.ifrs.hedges',
    value: '3',
    formattedValue: '3',
    status: 'ok',
  }),

  // ── Finance Domain: Consolidation ──
  'fin.lc.entities': async () => ({
    id: 'fin.lc.entities',
    value: '6',
    formattedValue: '6',
    status: 'ok',
  }),
  'fin.lc.eliminations': async () => ({
    id: 'fin.lc.eliminations',
    value: '4',
    formattedValue: '4',
    status: 'ok',
  }),
  'fin.lc.goodwill': async () => ({
    id: 'fin.lc.goodwill',
    value: '320000',
    formattedValue: '$320,000',
    trend: 'flat',
    trendValue: '0%',
    status: 'ok',
  }),

  // ── Finance Domain: Settings ──
  'fin.cfg.paymentTerms': async () => ({
    id: 'fin.cfg.paymentTerms',
    value: '8',
    formattedValue: '8',
    status: 'ok',
  }),
  'fin.cfg.matchRules': async () => ({
    id: 'fin.cfg.matchRules',
    value: '5',
    formattedValue: '5',
    status: 'ok',
  }),

  // ── Finance Domain: Reports ──
  'fin.rp.balanceSheet': async () => ({
    id: 'fin.rp.balanceSheet',
    value: '—',
    formattedValue: 'View Report',
    status: 'ok',
  }),
  'fin.rp.incomeStmt': async () => ({
    id: 'fin.rp.incomeStmt',
    value: '—',
    formattedValue: 'View Report',
    status: 'ok',
  }),
  'fin.rp.cashFlow': async () => ({
    id: 'fin.rp.cashFlow',
    value: '—',
    formattedValue: 'View Report',
    status: 'ok',
  }),

  // ── Home ──
  'home.activity': async () => ({
    id: 'home.activity',
    value: '23',
    formattedValue: '23 items',
    status: 'ok',
  }),

  // ── Admin ──
  'admin.tenants': async () => ({
    id: 'admin.tenants',
    value: '4',
    formattedValue: '4',
    status: 'ok',
  }),
  'admin.users': async () => ({
    id: 'admin.users',
    value: '28',
    formattedValue: '28',
    status: 'ok',
  }),

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

const MAX_SPARKLINE_POINTS = 20;

export async function resolveKPIs(
  ids: string[],
  ctx: RequestContextLike,
  options?: { comparisonMode?: 'vs_prior_period' | 'vs_budget' | 'vs_plan' }
): Promise<KPIResolverResult[]> {
  const resolvedCtx: RequestContextLike = {
    ...ctx,
    comparisonMode: options?.comparisonMode ?? ctx.comparisonMode,
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
