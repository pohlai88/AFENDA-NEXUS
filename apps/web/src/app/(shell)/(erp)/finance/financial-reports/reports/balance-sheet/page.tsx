import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import type { RequestContext } from '@afenda/core';
import { handleApiError } from '@/lib/api-error.server';
import { getBalanceSheet } from '@/features/finance/reports/queries/report.queries';
import { buildBalanceSheetExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { ReportSectionTable } from '@/features/finance/reports/blocks/report-section-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Balance Sheet' };

interface BalanceSheetPageProps {
  searchParams: Promise<{ ledgerId?: string; periodId?: string }>;
}

async function BalanceSheetContent({
  ctx,
  params,
}: {
  ctx: RequestContext;
  params: { ledgerId?: string; periodId?: string };
}) {
  const ledgerId = params.ledgerId ?? '';
  const periodId = params.periodId ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    ledgerId && periodId ? getBalanceSheet(ctx, { ledgerId, periodId }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) handleApiError(result, 'Failed to load balance sheet');
  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balance Sheet"
        description={
          data?.asOfDate
            ? `Assets, liabilities, and equity as of ${data.asOfDate}.`
            : 'Assets, liabilities, and equity at a point in time.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Balance Sheet' },
        ]}
        actions={data ? <ExportMenu payload={buildBalanceSheetExport(data)} /> : undefined}
      />

      <div className="flex flex-wrap items-end gap-4">
        <Suspense>
          <ReportFilterBar
            variant="ledger-period"
            ledgers={filterData.ledgers}
            periods={filterData.periods}
            defaults={{ ledgerId, periodId }}
          />
        </Suspense>
        <Suspense>
          <ReportSavedViews moduleKey="balance-sheet" />
        </Suspense>
      </div>

      {(!ledgerId || !periodId) && (
        <EmptyState
          contentKey="finance.reports.balanceSheet"
          constraint="page"
          variant="firstRun"
          icon={BarChart3}
        />
      )}

      {data && !data.isBalanced && (
        <div
          className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning"
          role="alert"
        >
          Warning: Balance sheet is out of balance. Assets do not equal Liabilities + Equity.
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <ReportSectionTable section={data.assets} />
          <ReportSectionTable section={data.liabilities} />
          <ReportSectionTable section={data.equity} />
        </div>
      )}
    </div>
  );
}

export default async function BalanceSheetPage({ searchParams }: BalanceSheetPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-muted" />}>
      <BalanceSheetContent ctx={ctx} params={params} />
    </Suspense>
  );
}
