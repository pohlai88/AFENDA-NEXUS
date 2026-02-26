import { Suspense } from 'react';
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  getDashboardKPIs,
  getCashFlowChart,
  getRevenueExpenseChart,
  getARAgingChart,
  getRecentActivity,
  getAttentionItems,
  getQuickActions,
} from '@/features/finance/dashboard/queries/dashboard.queries';
import { KPICards } from '@/features/finance/dashboard/blocks/kpi-cards';
import { DashboardCharts } from '@/features/finance/dashboard/blocks/dashboard-charts';
import { ActivityFeed } from '@/features/finance/dashboard/blocks/activity-feed';
import { QuickActions } from '@/features/finance/dashboard/blocks/quick-actions';
import { AttentionPanel } from '@/features/finance/dashboard/blocks/attention-panel';

export const metadata = {
  title: 'Finance Dashboard | Afenda',
  description: 'Financial overview and key performance indicators',
};

// ─── Loading Skeletons ───────────────────────────────────────────────────────

function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Dashboard Content Components ────────────────────────────────────────────

async function DashboardKPIs() {
  const result = await getDashboardKPIs();
  if (!result.ok) throw new Error('Failed to load KPIs');
  return <KPICards kpis={result.data} />;
}

async function DashboardChartsSection() {
  const [cashFlowResult, revenueExpenseResult, arAgingResult] = await Promise.all([
    getCashFlowChart(),
    getRevenueExpenseChart(),
    getARAgingChart(),
  ]);

  if (!cashFlowResult.ok || !revenueExpenseResult.ok || !arAgingResult.ok) {
    throw new Error('Failed to load charts');
  }

  return (
    <DashboardCharts
      cashFlowData={cashFlowResult.data}
      revenueExpenseData={revenueExpenseResult.data}
      arAgingData={arAgingResult.data}
    />
  );
}

async function DashboardActivityFeed() {
  const result = await getRecentActivity();
  if (!result.ok) throw new Error('Failed to load activity');
  return <ActivityFeed activities={result.data} />;
}

async function DashboardQuickActions() {
  const result = await getQuickActions();
  if (!result.ok) throw new Error('Failed to load actions');
  return <QuickActions actions={result.data} />;
}

async function DashboardAttentionPanel() {
  const result = await getAttentionItems();
  if (!result.ok) throw new Error('Failed to load attention items');
  return <AttentionPanel items={result.data} />;
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Finance Dashboard</PageHeaderHeading>
        <PageHeaderDescription>
          Overview of your organization's financial health and key metrics.
        </PageHeaderDescription>
      </PageHeader>

      {/* KPI Cards */}
      <Suspense fallback={<KPICardsSkeleton />}>
        <DashboardKPIs />
      </Suspense>

      {/* Attention Panel */}
      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <DashboardAttentionPanel />
      </Suspense>

      {/* Charts */}
      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardChartsSection />
      </Suspense>

      {/* Bottom Row: Activity + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <DashboardActivityFeed />
          </Suspense>
        </div>
        <Suspense fallback={<LoadingSkeleton variant="detail" />}>
          <DashboardQuickActions />
        </Suspense>
      </div>
    </div>
  );
}
