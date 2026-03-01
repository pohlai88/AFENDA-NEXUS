import { DashboardCharts } from './dashboard-charts';
import { ActivityFeed } from './activity-feed';
import { QuickActions } from './quick-actions';
import { AttentionPanel } from './attention-panel';
import {
  getCashFlowChart,
  getRevenueExpenseChart,
  getARAgingChart,
  getRecentActivity,
  getAttentionItems,
  getQuickActions,
} from '../queries/dashboard.queries';
import { getRequestContext } from '@/lib/auth';

// ChartsSkeleton is centralized in @/components/erp/loading-skeleton

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
