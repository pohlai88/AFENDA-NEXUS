/**
 * Finance Dashboard Sections
 * 
 * Server-side components for rendering dashboard sections.
 * Uses real API endpoint for data fetching with fallback to mock data during development.
 */

import * as React from 'react';
import { DashboardCharts } from './dashboard-charts';
import { ActivityFeed } from './activity-feed';
import { QuickActions } from './quick-actions';
import { AttentionPanel } from './attention-panel';
import { LiquidityWaterfallChart } from './liquidity-waterfall-chart';
import { FinancialRatiosChart } from './financial-ratios-chart';
import { DSOTrendChart } from './dso-trend-chart';
import { BudgetVarianceChart } from './budget-variance-chart';
import { AssetTreemapChart } from './asset-treemap-chart';
import {
  getCashFlowChart,
  getRevenueExpenseChart,
  getARAgingChart,
  getRecentActivity,
  getAttentionItems,
  getQuickActions,
} from '../queries/dashboard.queries';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';

// ─── Async Server Components ─────────────────────────────────────────────────

export async function DashboardChartsSection() {
  const ctx = await getRequestContext();
  const [cashFlowResult, revenueExpenseResult, arAgingResult] = await Promise.all([
    getCashFlowChart(ctx),
    getRevenueExpenseChart(ctx),
    getARAgingChart(ctx),
  ]);

  if (!cashFlowResult.ok || !revenueExpenseResult.ok || !arAgingResult.ok) {
    return null;
  }

  return (
    <DashboardCharts
      cashFlowData={cashFlowResult.value}
      revenueExpenseData={revenueExpenseResult.value}
      arAgingData={arAgingResult.value}
    />
  );
}

/**
 * New Chart Sections - Server Components for Enterprise Charts
 * Fetches data from unified dashboard API endpoint
 */

export async function LiquidityWaterfallSection() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  
  // Build query string for unified dashboard API
  const queryParams = new URLSearchParams({
    from: '2026-01-01',
    to: '2026-01-31',
    grain: 'month',
    compare: 'priorPeriod',
    widgets: 'liquidity-waterfall',
  });
  
  const result = await api.get<{ charts: Record<string, unknown> }>(
    `/api/finance/dashboard?${queryParams.toString()}`
  );
  
  const chartData = result.ok ? result.value.charts?.['liquidity-waterfall'] : undefined;
  const data = Array.isArray(chartData) ? chartData : [];
  const params = {
    range: { from: '2026-01-01', to: '2026-01-31' },
    grain: 'month' as const,
    compare: 'priorPeriod' as const,
  };
  
  return <LiquidityWaterfallChart data={data} params={params} />;
}

export async function FinancialRatiosSection() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  
  const queryParams = new URLSearchParams({
    from: '2026-01-01',
    to: '2026-01-31',
    grain: 'month',
    compare: 'none',
    widgets: 'financial-ratios',
  });
  
  const result = await api.get<{ charts: Record<string, unknown> }>(
    `/api/finance/dashboard?${queryParams.toString()}`
  );
  
  const chartData = result.ok ? result.value.charts?.['financial-ratios'] : undefined;
  const data = Array.isArray(chartData) ? chartData : [];
  const params = {
    range: { from: '2026-01-01', to: '2026-01-31' },
    grain: 'month' as const,
    compare: 'none' as const,
  };
  
  return <FinancialRatiosChart data={data} params={params} />;
}

export async function DSOTrendSection() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  
  const queryParams = new URLSearchParams({
    from: '2025-09-01',
    to: '2026-01-31',
    grain: 'month',
    compare: 'priorYear',
    widgets: 'dso-trend',
  });
  
  const result = await api.get<{ charts: Record<string, unknown> }>(
    `/api/finance/dashboard?${queryParams.toString()}`
  );
  
  const chartData = result.ok ? result.value.charts?.['dso-trend'] : undefined;
  const data = Array.isArray(chartData) ? chartData : [];
  const params = {
    range: { from: '2025-09-01', to: '2026-01-31' },
    grain: 'month' as const,
    compare: 'priorYear' as const,
  };
  
  return <DSOTrendChart data={data} params={params} />;
}

export async function BudgetVarianceSection() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  
  const queryParams = new URLSearchParams({
    from: '2026-01-01',
    to: '2026-01-31',
    grain: 'month',
    compare: 'budget',
    widgets: 'budget-variance',
  });
  
  const result = await api.get<{ charts: Record<string, unknown> }>(
    `/api/finance/dashboard?${queryParams.toString()}`
  );
  
  const chartData = result.ok ? result.value.charts?.['budget-variance'] : undefined;
  const data = Array.isArray(chartData) ? chartData : [];
  const params = {
    range: { from: '2026-01-01', to: '2026-01-31' },
    grain: 'month' as const,
    compare: 'budget' as const,
  };
  
  return <BudgetVarianceChart data={data} params={params} type="expense" />;
}

export async function AssetTreemapSection() {
  const ctx = await getRequestContext();
  const api = createApiClient(ctx);
  
  const queryParams = new URLSearchParams({
    from: '2026-01-01',
    to: '2026-01-31',
    grain: 'month',
    compare: 'none',
    widgets: 'asset-portfolio',
  });
  
  const result = await api.get<{ charts: Record<string, unknown> }>(
    `/api/finance/dashboard?${queryParams.toString()}`
  );
  
  const chartData = result.ok ? result.value.charts?.['asset-portfolio'] : undefined;
  const data = Array.isArray(chartData) ? chartData : [];
  const params = {
    range: { from: '2026-01-01', to: '2026-01-31' },
    grain: 'month' as const,
    compare: 'none' as const,
  };
  
  return <AssetTreemapChart data={data} params={params} />;
}

// Original sections
export async function DashboardActivityFeed() {
  const ctx = await getRequestContext();
  const result = await getRecentActivity(ctx);
  if (!result.ok) return null;
  return <ActivityFeed activities={result.value} />;
}

export async function DashboardQuickActionsSection() {
  const ctx = await getRequestContext();
  const result = await getQuickActions(ctx);
  if (!result.ok) return null;
  return <QuickActions actions={result.value} />;
}

export async function DashboardAttentionSection() {
  const ctx = await getRequestContext();
  const result = await getAttentionItems(ctx);
  if (!result.ok) return null;
  return <AttentionPanel items={result.value} />;
}
