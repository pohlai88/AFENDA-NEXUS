import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getEquityStatement } from '@/features/finance/reports/queries/report.queries';
import { buildEquityStatementExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { EquityStatementTable } from '@/features/finance/reports/blocks/equity-statement-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Equity Statement' };

interface EquityStatementPageProps {
  searchParams: Promise<{
    ledgerId?: string;
    fromPeriodId?: string;
    toPeriodId?: string;
  }>;
}

export default async function EquityStatementPage({ searchParams }: EquityStatementPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();
  const ledgerId = params.ledgerId ?? '';
  const fromPeriodId = params.fromPeriodId ?? '';
  const toPeriodId = params.toPeriodId ?? '';
  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    ledgerId && fromPeriodId && toPeriodId
      ? getEquityStatement(ctx, { ledgerId, fromPeriodId, toPeriodId })
      : Promise.resolve(null),
  ]);
  if (result && !result.ok) {
    handleApiError(result, 'Failed to load equity statement');
  }
  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statement of Changes in Equity"
        description={
          data?.periodRange
            ? `Equity movements for ${data.periodRange}.`
            : 'Movements in equity components for the reporting period.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Equity Statement' },
        ]}
        actions={data ? <ExportMenu payload={buildEquityStatementExport(data)} /> : undefined}
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
          <ReportSavedViews moduleKey="equity-statement" />
        </Suspense>
      </div>

      {(!ledgerId || !fromPeriodId || !toPeriodId) && <EmptyState contentKey="finance.reports.equityStatement" variant="firstRun" icon={BarChart3} />}

      {data && <EquityStatementTable data={data} />}
    </div>
  );
}
