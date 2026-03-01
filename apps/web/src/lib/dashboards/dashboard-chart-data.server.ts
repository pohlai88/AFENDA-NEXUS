import 'server-only';

import { createApiClient } from '@/lib/api-client';
import type {
  CashFlowDataPoint,
  RevenueExpenseDataPoint,
  AgingBucket,
} from '@/features/finance/dashboard/types';

type RequestCtx = { tenantId: string; userId?: string; token?: string };

// ─── Stub data (matches chart component expectations) ─────────────────────────
// Used when API dashboard chart endpoints are not yet available.
// TODO: Remove when /dashboard/cash-flow-chart, /dashboard/revenue-expense-chart,
// /dashboard/ar-aging-chart exist in the API.

const STUB_CASH_FLOW: CashFlowDataPoint[] = [
  { month: 'Sep', inflows: 124000, outflows: 98000, net: 26000 },
  { month: 'Oct', inflows: 156000, outflows: 112000, net: 44000 },
  { month: 'Nov', inflows: 142000, outflows: 128000, net: 14000 },
  { month: 'Dec', inflows: 189000, outflows: 145000, net: 44000 },
  { month: 'Jan', inflows: 167000, outflows: 134000, net: 33000 },
  { month: 'Feb', inflows: 178000, outflows: 142000, net: 36000 },
];

const STUB_REVENUE_EXPENSE: RevenueExpenseDataPoint[] = [
  { month: 'Sep', revenue: 145000, expenses: 98000, profit: 47000 },
  { month: 'Oct', revenue: 168000, expenses: 112000, profit: 56000 },
  { month: 'Nov', revenue: 152000, expenses: 128000, profit: 24000 },
  { month: 'Dec', revenue: 195000, expenses: 145000, profit: 50000 },
  { month: 'Jan', revenue: 172000, expenses: 134000, profit: 38000 },
  { month: 'Feb', revenue: 185000, expenses: 142000, profit: 43000 },
];

const STUB_AR_AGING: AgingBucket[] = [
  { range: 'Current', amount: 45000, count: 12 },
  { range: '1-30', amount: 22000, count: 5 },
  { range: '31-60', amount: 8500, count: 3 },
  { range: '61-90', amount: 3200, count: 2 },
  { range: '90+', amount: 1800, count: 1 },
];

const STUB_AP_AGING: AgingBucket[] = [
  { range: 'Current', amount: 62000, count: 18 },
  { range: '1-30', amount: 18500, count: 6 },
  { range: '31-60', amount: 9200, count: 4 },
  { range: '61-90', amount: 4100, count: 2 },
  { range: '90+', amount: 2200, count: 1 },
];

// ─── Fetchers with API-first, stub fallback ─────────────────────────────────

export async function fetchCashFlowChart(ctx: RequestCtx): Promise<CashFlowDataPoint[]> {
  try {
    const api = createApiClient(ctx);
    const result = await api.get<CashFlowDataPoint[]>('/dashboard/cash-flow-chart');
    if (result.ok && Array.isArray(result.value) && result.value.length > 0) {
      return result.value;
    }
  } catch {
    // Fall through to stub
  }
  return STUB_CASH_FLOW;
}

export async function fetchRevenueExpenseChart(
  ctx: RequestCtx
): Promise<RevenueExpenseDataPoint[]> {
  try {
    const api = createApiClient(ctx);
    const result = await api.get<RevenueExpenseDataPoint[]>('/dashboard/revenue-expense-chart');
    if (result.ok && Array.isArray(result.value) && result.value.length > 0) {
      return result.value;
    }
  } catch {
    // Fall through to stub
  }
  return STUB_REVENUE_EXPENSE;
}

export async function fetchArAgingDiagram(ctx: RequestCtx): Promise<AgingBucket[]> {
  try {
    const api = createApiClient(ctx);
    const result = await api.get<AgingBucket[]>('/dashboard/ar-aging-chart');
    if (result.ok && Array.isArray(result.value) && result.value.length > 0) {
      return result.value;
    }
    // Try /ar/aging and transform if available
    const arResult = await api.get<{ totals: Record<string, number> }>('/ar/aging');
    if (arResult.ok && arResult.value?.totals) {
      const t = arResult.value.totals;
      return [
        { range: 'Current', amount: Number(t.current ?? 0), count: 0 },
        { range: '1-30', amount: Number(t.days30 ?? 0), count: 0 },
        { range: '31-60', amount: Number(t.days60 ?? 0), count: 0 },
        { range: '61-90', amount: Number(t.days90 ?? 0), count: 0 },
        { range: '90+', amount: Number(t.over90 ?? 0), count: 0 },
      ].filter((b) => b.amount > 0);
    }
  } catch {
    // Fall through to stub
  }
  return STUB_AR_AGING;
}

export async function fetchApAgingDiagram(ctx: RequestCtx): Promise<AgingBucket[]> {
  try {
    const api = createApiClient(ctx);
    const result = await api.get<AgingBucket[]>('/dashboard/ap-aging-chart');
    if (result.ok && Array.isArray(result.value) && result.value.length > 0) {
      return result.value;
    }
    const apResult = await api.get<{ totals: Record<string, number> }>('/ap/aging');
    if (apResult.ok && apResult.value?.totals) {
      const t = apResult.value.totals;
      return [
        { range: 'Current', amount: Number(t.current ?? 0), count: 0 },
        { range: '1-30', amount: Number(t.days30 ?? 0), count: 0 },
        { range: '31-60', amount: Number(t.days60 ?? 0), count: 0 },
        { range: '61-90', amount: Number(t.days90 ?? 0), count: 0 },
        { range: '90+', amount: Number(t.over90 ?? 0), count: 0 },
      ].filter((b) => b.amount > 0);
    }
  } catch {
    // Fall through to stub
  }
  return STUB_AP_AGING;
}

// ─── Unified fetcher for chart-registry compatibility ──────────────────────

export async function fetchChartData(
  chartId: string,
  ctx: RequestCtx
): Promise<CashFlowDataPoint[] | RevenueExpenseDataPoint[] | null> {
  switch (chartId) {
    case 'chart.cashflow':
      return fetchCashFlowChart(ctx);
    case 'chart.revenueExpense':
      return fetchRevenueExpenseChart(ctx);
    default:
      return null;
  }
}

export async function fetchDiagramData(
  diagramId: string,
  ctx: RequestCtx
): Promise<AgingBucket[] | null> {
  switch (diagramId) {
    case 'diagram.arAging':
      return fetchArAgingDiagram(ctx);
    case 'diagram.apAging':
      return fetchApAgingDiagram(ctx);
    default:
      return null;
  }
}
