import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { DomainDashboardShell, FINANCE_OVERVIEW_CONFIG } from '@/lib/dashboards';
import {
  DashboardActivityFeed,
  DashboardQuickActionsSection,
  DashboardAttentionSection,
} from '@/features/finance/dashboard/blocks/dashboard-sections';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Finance Dashboard',
  description:
    'Real-time financial overview, KPIs, and key performance indicators for your organization',
  openGraph: {
    title: 'Finance Dashboard | Afenda',
    description: 'Real-time financial overview and key performance indicators',
  },
};

/**
 * Finance module landing page — `/finance/`.
 *
 * Uses the standardized dual-panel layout:
 *   Top:    KPI deck — cross-cutting finance KPIs (user-configurable)
 *   Bottom: Feature grid — every finance sub-module as a shortcut card
 *
 * Below the dual-panel, finance-specific sections provide operational
 * visibility: attention items, charts, activity feed, quick actions.
 */
export default function FinanceDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Dual-Panel: KPI Deck + Feature Grid ── */}
      <DomainDashboardShell config={FINANCE_OVERVIEW_CONFIG} />

      {/* ── Attention Items (overdue, blocked, etc.) ── */}
      <Suspense fallback={<LoadingSkeleton variant="detail" />}>
        <DashboardAttentionSection />
      </Suspense>

      {/* ── Activity Feed + Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSkeleton variant="table" />}>
            <DashboardActivityFeed />
          </Suspense>
        </div>
        <Suspense fallback={<LoadingSkeleton variant="detail" />}>
          <DashboardQuickActionsSection />
        </Suspense>
      </div>
    </div>
  );
}
