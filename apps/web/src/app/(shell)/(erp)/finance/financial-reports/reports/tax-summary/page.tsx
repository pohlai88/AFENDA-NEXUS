import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getTaxSummary } from '@/features/finance/reports/queries/report.queries';
import { buildTaxSummaryExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { TaxSummaryTable } from '@/features/finance/reports/blocks/tax-summary-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Tax Summary' };

interface TaxSummaryPageProps {
  searchParams: Promise<{
    ledgerId?: string;
    fromPeriodId?: string;
    toPeriodId?: string;
  }>;
}

async function TaxSummaryContent({
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
      ? getTaxSummary(ctx, { fromPeriodId, toPeriodId })
      : Promise.resolve(null),
  ]);
  if (result && !result.ok) {
    handleApiError(result, 'Failed to load tax summary');
  }
  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Summary"
        description={
          data?.periodRange
            ? `Tax summary for ${data.periodRange}.`
            : 'Consolidated view of all tax obligations.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Tax Summary' },
        ]}
        actions={data ? <ExportMenu payload={buildTaxSummaryExport(data)} /> : undefined}
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
          <ReportSavedViews moduleKey="tax-summary" />
        </Suspense>
      </div>

      {(!fromPeriodId || !toPeriodId) && (
        <EmptyState
          contentKey="finance.reports.taxSummary"
          constraint="page"
          variant="firstRun"
          icon={BarChart3}
        />
      )}

      {data ? <TaxSummaryTable data={data} /> : null}
    </div>
  );
}

export default async function TaxSummaryPage({ searchParams }: TaxSummaryPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const ledgerId = params.ledgerId ?? '';
  const fromPeriodId = params.fromPeriodId ?? '';
  const toPeriodId = params.toPeriodId ?? '';

  return (
    <Suspense>
      <TaxSummaryContent
        ctx={ctx}
        ledgerId={ledgerId}
        fromPeriodId={fromPeriodId}
        toPeriodId={toPeriodId}
      />
    </Suspense>
  );
}
