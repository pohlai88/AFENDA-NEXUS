import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { StatusBadge } from '@/components/erp/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardPage as ModuleDashboard } from '@/components/erp/dashboard-page';
import { DashboardWidgets } from '@/components/erp/dashboard-widgets';
import { NeedsAttention } from '@/components/erp/needs-attention';
import { resolveAttentionSummary } from '@/lib/attention/attention-registry.server';
import { getRequestContext } from '@/lib/auth';
import { formatMoney, formatRelativeTime } from '@/lib/format';
import { getDashboardSummary } from '@/features/finance/dashboard/queries/dashboard.queries';
import { DollarSign, ArrowUpRight, ArrowDownLeft, CalendarDays, Activity, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your financial operations and key metrics.',
  openGraph: {
    title: 'Dashboard | Afenda',
    description: 'Overview of your financial operations.',
  },
};

// ─── Summary Skeleton (streaming fallback) ────────────────────────────────────

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key -- Static skeleton fallback
          <Skeleton key={`skeleton-${i}`} className="h-[120px] rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg lg:col-span-2" />
      </div>
    </div>
  );
}

// ─── Async Summary (streams in after layout + KPIs) ───────────────────────────
// async-parallel: fetch summary and attention in parallel to eliminate waterfall

async function HomeSummary() {
  const ctx = await getRequestContext();
  const [summaryResult, attentionResult] = await Promise.all([
    getDashboardSummary(ctx),
    resolveAttentionSummary(ctx).catch(() => null),
  ]);

  if (!summaryResult.ok) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <p className="text-sm text-destructive">
          Failed to load dashboard data. Please try again later.
        </p>
      </div>
    );
  }

  const { cashBalance, openAr, openAp, currentPeriod, recentActivity } = summaryResult.value;
  const attentionSummary = attentionResult ?? {
    items: [],
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold tabular-nums font-mono ${cashBalance < 0 ? 'text-destructive' : ''}`}
            >
              {formatMoney(cashBalance, 'USD')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Sum of ASSET accounts (1xxx)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Receivables
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums font-mono">
              {formatMoney(openAr.total, 'USD')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {openAr.count} open invoice{openAr.count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Payables
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums font-mono">
              {formatMoney(openAp.total, 'USD')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {openAp.count} open invoice{openAp.count !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Period
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {currentPeriod ? (
              <>
                <p className="text-2xl font-bold">{currentPeriod.name}</p>
                <div className="mt-1">
                  <StatusBadge status={currentPeriod.status} />
                </div>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="mt-1 text-xs text-muted-foreground">No open period</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Needs Attention (1/3) + Recent Activity (2/3) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NeedsAttention summary={attentionSummary} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recent activity to display.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-4 rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{formatEventType(entry.eventType)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate font-mono">
                      {entry.id}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={entry.createdAt}
                  >
                    {formatRelativeTime(entry.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}

function formatEventType(eventType: string): string {
  return eventType
    .replace(/([A-Z])/g, ' $1')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ─── Main Page (streams summary via Suspense) ──────────────────────────────────

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your financial operations." />
      <ModuleDashboard scope={{ type: 'module', id: 'home' }} />
      <Suspense fallback={<SummarySkeleton />}>
        <HomeSummary />
      </Suspense>
      <DashboardWidgets />
    </div>
  );
}
