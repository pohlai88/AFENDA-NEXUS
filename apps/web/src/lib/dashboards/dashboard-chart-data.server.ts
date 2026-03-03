import 'server-only';

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import type {
  CashFlowDataPoint,
  RevenueExpenseDataPoint,
  AgingBucket,
} from '@/features/finance/dashboard/types';

// Simple context type for chart data fetchers
type ChartRequestContext = {
  tenantId: string;
  userId?: string;
  token?: string;
};

// ─── Fetchers — API-first, empty array on failure (enables empty state) ──────
// Wrapped with React cache() for automatic request memoization (RBP-CACHE).

export const fetchCashFlowChart = cache(
  async (ctx: ChartRequestContext): Promise<CashFlowDataPoint[]> => {
    try {
      const api = createApiClient(ctx);
      const result = await api.get<CashFlowDataPoint[]>('/dashboard/cash-flow-chart');
      if (result.ok && Array.isArray(result.value)) {
        return result.value;
      }
    } catch {
      // API unavailable — return empty to trigger empty state
    }
    return [];
  }
);

export const fetchRevenueExpenseChart = cache(
  async (ctx: ChartRequestContext): Promise<RevenueExpenseDataPoint[]> => {
    try {
      const api = createApiClient(ctx);
      const result = await api.get<RevenueExpenseDataPoint[]>('/dashboard/revenue-expense-chart');
      if (result.ok && Array.isArray(result.value)) {
        return result.value;
      }
    } catch {
      // API unavailable — return empty to trigger empty state
    }
    return [];
  }
);

export const fetchArAgingDiagram = cache(
  async (ctx: ChartRequestContext): Promise<AgingBucket[]> => {
    try {
      const api = createApiClient(ctx);
      const result = await api.get<AgingBucket[]>('/dashboard/ar-aging-chart');
      if (result.ok && Array.isArray(result.value)) {
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
      // API unavailable — return empty to trigger empty state
    }
    return [];
  }
);

export const fetchApAgingDiagram = cache(
  async (ctx: ChartRequestContext): Promise<AgingBucket[]> => {
    try {
      const api = createApiClient(ctx);
      const result = await api.get<AgingBucket[]>('/dashboard/ap-aging-chart');
      if (result.ok && Array.isArray(result.value)) {
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
      // API unavailable — return empty to trigger empty state
    }
    return [];
  }
);

// ─── Unified fetcher for chart-registry compatibility ──────────────────────

export const fetchChartData = cache(
  async (
    chartId: string,
    ctx: ChartRequestContext
  ): Promise<CashFlowDataPoint[] | RevenueExpenseDataPoint[] | null> => {
    switch (chartId) {
      case 'chart.cashflow':
        return fetchCashFlowChart(ctx);
      case 'chart.revenueExpense':
        return fetchRevenueExpenseChart(ctx);
      default:
        return null;
    }
  }
);

export const fetchDiagramData = cache(
  async (diagramId: string, ctx: ChartRequestContext): Promise<AgingBucket[] | null> => {
    switch (diagramId) {
      case 'diagram.arAging':
        return fetchArAgingDiagram(ctx);
      case 'diagram.apAging':
        return fetchApAgingDiagram(ctx);
      default:
        return null;
    }
  }
);
