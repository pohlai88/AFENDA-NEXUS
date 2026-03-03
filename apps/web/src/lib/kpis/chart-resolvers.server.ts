import 'server-only';

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import { getRequestContext } from '@/lib/auth';

// ─── Chart Resolvers (Server-Only) ──────────────────────────────────────────
//
// Async resolvers for dashboard chart data. API-first with fallback data.
// Each chart displays a "Preview" badge when using fallback data;
// cleared once data is fetched from real API endpoints.
//
// Pattern matches kpi-registry.server.ts: error-isolated, deterministic.
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CashFlowPoint {
  month: string;
  inflow: number;
  outflow: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
}

export interface AgingBucket {
  bucket: string;
  amount: number;
}

export interface ChartData {
  cashFlow: CashFlowPoint[];
  expenses: ExpenseCategory[];
  arAging: AgingBucket[];
  /** Whether this data is preview/fallback (true) or from real queries (false). */
  isPreview: boolean;
}

// ─── Fallback Data ───────────────────────────────────────────────────────────

const FALLBACK_CASH_FLOW: CashFlowPoint[] = [
  { month: 'Sep', inflow: 124000, outflow: 98000 },
  { month: 'Oct', inflow: 156000, outflow: 112000 },
  { month: 'Nov', inflow: 142000, outflow: 128000 },
  { month: 'Dec', inflow: 189000, outflow: 145000 },
  { month: 'Jan', inflow: 167000, outflow: 134000 },
  { month: 'Feb', inflow: 178000, outflow: 142000 },
];

const FALLBACK_EXPENSES: ExpenseCategory[] = [
  { category: 'Payroll', amount: 85000 },
  { category: 'Rent', amount: 12000 },
  { category: 'Software', amount: 8500 },
  { category: 'Travel', amount: 4200 },
  { category: 'Marketing', amount: 6800 },
  { category: 'Utilities', amount: 2100 },
];

const FALLBACK_AR_AGING: AgingBucket[] = [
  { bucket: 'Current', amount: 45000 },
  { bucket: '1-30', amount: 22000 },
  { bucket: '31-60', amount: 8500 },
  { bucket: '61-90', amount: 3200 },
  { bucket: '90+', amount: 1800 },
];

// ─── Resolver ────────────────────────────────────────────────────────────────

/**
 * Resolve chart data for the dashboard.
 * API-first with fallback data when endpoints are unreachable.
 * Error-isolated: never throws — returns fallback data on failure.
 * Wrapped with React cache() for automatic request memoization (RBP-CACHE).
 */
export const resolveChartData = cache(async (): Promise<ChartData> => {
  try {
    const ctx = await getRequestContext();
    const client = createApiClient(ctx);

    const [cfResult, expResult, arResult] = await Promise.all([
      client
        .get<{ month: string; inflows: number; outflows: number }[]>('/dashboard/cash-flow-chart')
        .catch(() => null),
      client
        .get<{ summary: { category: string; total: number }[] }>('/expense-claims/summary')
        .catch(() => null),
      client.get<{ totals: Record<string, number> }>('/ar/aging').catch(() => null),
    ]);

    const cashFlow: CashFlowPoint[] =
      cfResult?.ok && Array.isArray(cfResult.value) && cfResult.value.length > 0
        ? cfResult.value.map((d) => ({ month: d.month, inflow: d.inflows, outflow: d.outflows }))
        : FALLBACK_CASH_FLOW;

    const expenses: ExpenseCategory[] =
      expResult?.ok && expResult.value?.summary?.length
        ? expResult.value.summary.map((s) => ({ category: s.category, amount: s.total }))
        : FALLBACK_EXPENSES;

    let arAging: AgingBucket[] = FALLBACK_AR_AGING;
    if (arResult?.ok && arResult.value?.totals) {
      const t = arResult.value.totals;
      const mapped = [
        { bucket: 'Current', amount: Number(t.current ?? 0) },
        { bucket: '1-30', amount: Number(t.days30 ?? 0) },
        { bucket: '31-60', amount: Number(t.days60 ?? 0) },
        { bucket: '61-90', amount: Number(t.days90 ?? 0) },
        { bucket: '90+', amount: Number(t.over90 ?? 0) },
      ].filter((b) => b.amount > 0);
      if (mapped.length > 0) arAging = mapped;
    }

    const isPreview =
      cashFlow === FALLBACK_CASH_FLOW &&
      expenses === FALLBACK_EXPENSES &&
      arAging === FALLBACK_AR_AGING;

    return { cashFlow, expenses, arAging, isPreview };
  } catch {
    // Error-isolated: return fallback data
    return {
      cashFlow: FALLBACK_CASH_FLOW,
      expenses: FALLBACK_EXPENSES,
      arAging: FALLBACK_AR_AGING,
      isPreview: true,
    };
  }
});
