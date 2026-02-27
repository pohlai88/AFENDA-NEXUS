// ─── KPI Resolver Types ─────────────────────────────────────────────────────
// Raw metrics only — no 'template' (that's in the catalog).
// Server-only file: NEVER import from client code.

export interface KPIResolverResult {
  id: string;
  value: string;
  formattedValue: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  sparklineData?: number[];
  buckets?: Array<{ label: string; value: number }>;
  status?: 'ok' | 'error';
}

interface RequestContextLike {
  token?: string;
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

export const KPI_RESOLVERS: Record<string, KPIResolver> = {
  // ── Finance Module ──
  'fin.cash': async () => ({
    id: 'fin.cash',
    value: '1250000',
    formattedValue: '$1,250,000',
    trend: 'up',
    trendValue: '+3.2%',
    status: 'ok',
  }),
  'fin.ap': async () => ({
    id: 'fin.ap',
    value: '340000',
    formattedValue: '$340,000',
    trend: 'down',
    trendValue: '-5.1%',
    status: 'ok',
  }),
  'fin.ar': async () => ({
    id: 'fin.ar',
    value: '520000',
    formattedValue: '$520,000',
    trend: 'up',
    trendValue: '+2.8%',
    status: 'ok',
  }),
  'fin.pnl': async () => ({
    id: 'fin.pnl',
    value: '85000',
    formattedValue: '$85,000',
    trend: 'up',
    trendValue: '+12.4%',
    status: 'ok',
  }),

  // ── Finance Domain: AP ──
  'fin.ap.total': async () => ({
    id: 'fin.ap.total',
    value: '340000',
    formattedValue: '$340,000',
    trend: 'down',
    trendValue: '-5.1%',
    status: 'ok',
  }),
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
  }),
  'fin.ap.pending': async () => ({
    id: 'fin.ap.pending',
    value: '5',
    formattedValue: '5',
    status: 'ok',
  }),

  // ── Finance Domain: AR ──
  'fin.ar.total': async () => ({
    id: 'fin.ar.total',
    value: '520000',
    formattedValue: '$520,000',
    trend: 'up',
    trendValue: '+2.8%',
    status: 'ok',
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
  }),
  'fin.bank.unreconciled': async () => ({
    id: 'fin.bank.unreconciled',
    value: '14',
    formattedValue: '14',
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
  ctx: RequestContextLike
): Promise<KPIResolverResult[]> {
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
      return resolver(ctx).catch((err: unknown): KPIResolverResult => {
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

  return results.map((r): KPIResolverResult => {
    if (r.status !== 'fulfilled' || !r.value) {
      return { id: '?', value: '—', formattedValue: '—', status: 'error' };
    }

    const result = r.value;

    // Enforce sparkline bounds
    if (result.sparklineData && result.sparklineData.length > MAX_SPARKLINE_POINTS) {
      result.sparklineData = result.sparklineData.slice(-MAX_SPARKLINE_POINTS);
    }

    return result;
  });
}
