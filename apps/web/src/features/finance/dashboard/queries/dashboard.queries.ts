import type {
  KPICard,
  CashFlowDataPoint,
  RevenueExpenseDataPoint,
  ActivityItem,
  AttentionItem,
  QuickAction,
  AgingBucket,
} from '../types';
import type { IdParam } from '@afenda/contracts';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';

// ─── Dashboard Summary (root shell) ──────────────────────────────────────────

export interface DashboardSummary {
  cashBalance: number;
  openAr: { count: number; total: number };
  openAp: { count: number; total: number };
  currentPeriod: { id: string; name: string; status: string } | null;
  recentActivity: Array<{ id: string; eventType: string; createdAt: string; payload?: unknown }>;
}

type RequestCtx = { tenantId: IdParam['id']; userId?: string; token?: string };

export async function getDashboardSummary(ctx: RequestCtx): Promise<ApiResult<DashboardSummary>> {
  const client = createApiClient(ctx);
  return client.get<DashboardSummary>('/dashboard/summary');
}

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getDashboardKPIs(ctx: RequestCtx) {
  const client = createApiClient(ctx);
  return client.get<KPICard[]>('/dashboard/kpis');
}

export async function getCashFlowChart(ctx: RequestCtx) {
  const client = createApiClient(ctx);
  return client.get<CashFlowDataPoint[]>('/dashboard/cash-flow-chart');
}

export async function getRevenueExpenseChart(ctx: RequestCtx) {
  const client = createApiClient(ctx);
  return client.get<RevenueExpenseDataPoint[]>('/dashboard/revenue-expense-chart');
}

export async function getARAgingChart(ctx: RequestCtx) {
  const client = createApiClient(ctx);
  return client.get<AgingBucket[]>('/dashboard/ar-aging-chart');
}

export async function getRecentActivity(ctx: RequestCtx) {
  const client = createApiClient(ctx);
  return client.get<ActivityItem[]>('/dashboard/recent-activity');
}

export async function getAttentionItems(ctx: RequestCtx) {
  const client = createApiClient(ctx);
  return client.get<AttentionItem[]>('/dashboard/attention-items');
}

export async function getQuickActions(ctx: RequestCtx) {
  const client = createApiClient(ctx);
  return client.get<QuickAction[]>('/dashboard/quick-actions');
}
