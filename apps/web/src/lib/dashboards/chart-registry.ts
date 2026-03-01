/**
 * Dashboard chart and diagram registry.
 *
 * Makes charts and diagrams available to sub-domain dashboards per architecture.
 * Each domain config declares which chartIds and diagramIds to render.
 */

/** Sentinel value when user selects "None" for chart/diagram. */
export const CHART_DIAGRAM_NONE = '__none__';

import type { ApiResult } from '@/lib/types';
import type {
  CashFlowDataPoint,
  RevenueExpenseDataPoint,
  AgingBucket,
} from '@/features/finance/dashboard/types';
import {
  getCashFlowChart,
  getRevenueExpenseChart,
  getARAgingChart,
} from '@/features/finance/dashboard/queries/dashboard.queries';

type RequestCtx = { tenantId: string; userId?: string; token?: string };

// ─── Chart Registry (time-series: bar, area) ──────────────────────────────

export const CHART_FETCHERS: Record<
  string,
  (ctx: RequestCtx) => Promise<ApiResult<unknown>>
> = {
  'chart.cashflow': (ctx) => getCashFlowChart(ctx),
  'chart.revenueExpense': (ctx) => getRevenueExpenseChart(ctx),
};

export const CHART_META: Record<string, { title: string; description: string }> = {
  'chart.cashflow': { title: 'Cash Flow', description: 'Monthly inflows vs outflows' },
  'chart.revenueExpense': { title: 'Revenue & Expenses', description: 'Monthly P&L trend' },
};

export type ChartId = keyof typeof CHART_FETCHERS;

// ─── Diagram Registry (compositional: donut, bar) ──────────────────────────

export const DIAGRAM_FETCHERS: Record<
  string,
  (ctx: RequestCtx) => Promise<ApiResult<unknown>>
> = {
  'diagram.arAging': (ctx) => getARAgingChart(ctx),
};

export const DIAGRAM_META: Record<string, { title: string; description: string }> = {
  'diagram.arAging': { title: 'AR Aging', description: 'Receivables by age bucket' },
  'diagram.apAging': { title: 'AP Aging', description: 'Payables by age bucket' },
};

export type DiagramId = keyof typeof DIAGRAM_FETCHERS;
