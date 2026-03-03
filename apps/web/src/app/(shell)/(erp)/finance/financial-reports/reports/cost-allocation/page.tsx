import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getCostAllocationReport } from '@/features/finance/reports/queries/report.queries';
import { buildCostAllocationExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { CostAllocationTable } from '@/features/finance/reports/blocks/cost-allocation-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Cost Allocation' };

interface CostAllocationPageProps {
  searchParams: Promise<{
    ledgerId?: string;
    fromPeriodId?: string;
    toPeriodId?: string;
  }>;
}

async function CostAllocationContent({
  ctx,
  ledgerId,
  fromPeriodId,
  toPeriodId,
}: {
  ctx: RequestContext;
  ledgerId: string;
  fromPeriodId: string;
  toPeriodId: string;
}) {
  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    fromPeriodId && toPeriodId
      ? getCostAllocationReport(ctx, { fromPeriodId, toPeriodId })
      : Promise.resolve(null),
  ]);
  if (result && !result.ok) {
    handleApiError(result, 'Failed to load cost allocation report');
  }
  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Allocation Report"
        description={
          data?.periodRange
            ? `Cost centre allocations for ${data.periodRange}.`
            : 'Cost centre allocations for the period.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Cost Allocation' },
        ]}
        actions={data ? <ExportMenu payload={buildCostAllocationExport(data)} /> : undefined}
      />

      <div className="flex flex-wrap items-end gap-4">
        <Suspense>
          <ReportFilterBar
            variant="ledger-period-range"
            ledgers={filterData.ledgers}
            periods={filterData.periods}
            defaults={{ ledgerId, fromPeriodId, toPeriodId }}
          />
        </Suspense>
        <Suspense>
          <ReportSavedViews moduleKey="cost-allocation" />
        </Suspense>
      </div>

      {(!fromPeriodId || !toPeriodId) && (
        <EmptyState
          contentKey="finance.reports.costAllocation"
          constraint="page"
          variant="firstRun"
          icon={BarChart3}
        />
      )}

      {data ? <CostAllocationTable data={data} /> : null}
    </div>
  );
}

export default async function CostAllocationPage({ searchParams }: CostAllocationPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const ledgerId = params.ledgerId ?? '';
  const fromPeriodId = params.fromPeriodId ?? '';
  const toPeriodId = params.toPeriodId ?? '';

  return (
    <Suspense>
      <CostAllocationContent
        ctx={ctx}
        ledgerId={ledgerId}
        fromPeriodId={fromPeriodId}
        toPeriodId={toPeriodId}
      />
    </Suspense>
  );
}
