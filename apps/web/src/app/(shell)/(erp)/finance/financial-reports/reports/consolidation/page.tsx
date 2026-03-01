import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getConsolidationReport } from '@/features/finance/reports/queries/report.queries';
import { buildConsolidationReportExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { ConsolidationReportTable } from '@/features/finance/reports/blocks/consolidation-report-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Consolidation Report' };

interface ConsolidationPageProps {
  searchParams: Promise<{
    ledgerId?: string;
    periodId?: string;
  }>;
}

export default async function ConsolidationReportPage({ searchParams }: ConsolidationPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  const ledgerId = params.ledgerId ?? '';
  const periodId = params.periodId ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    periodId ? getConsolidationReport(ctx, { periodId }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load consolidation report');
  }

  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Group Consolidation Report"
        description={
          data?.asOfDate
            ? `Consolidated financials as of ${data.asOfDate}.`
            : 'Consolidated financial results by entity.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Consolidation' },
        ]}
        actions={data ? <ExportMenu payload={buildConsolidationReportExport(data)} /> : undefined}
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
          <ReportSavedViews moduleKey="consolidation" />
        </Suspense>
      </div>

      {!periodId && <EmptyState contentKey="finance.reports.consolidation" variant="firstRun" icon={BarChart3} />}

      { data ? <ConsolidationReportTable data={data} /> : null}
    </div>
  );
}
