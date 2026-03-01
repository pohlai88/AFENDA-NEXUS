import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getCashFlow } from '@/features/finance/reports/queries/report.queries';
import { buildCashFlowExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { CashFlowDisplay } from '@/features/finance/reports/blocks/cash-flow-display';
import { Banknote } from 'lucide-react';

export const metadata = { title: 'Cash Flow Statement' };

interface CashFlowPageProps {
  searchParams: Promise<{ ledgerId?: string; fromPeriodId?: string; toPeriodId?: string }>;
}

export default async function CashFlowPage({ searchParams }: CashFlowPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const { ledgerId = '', fromPeriodId = '', toPeriodId = '' } = params;

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    ledgerId && fromPeriodId && toPeriodId
      ? getCashFlow(ctx, { ledgerId, fromPeriodId, toPeriodId })
      : Promise.resolve(null),
  ]);

  if (result && !result.ok) handleApiError(result, 'Failed to load cash flow statement');
  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Flow Statement"
        description={data?.periodRange ? `Cash flows for ${data.periodRange}.` : 'Operating, investing, and financing activities.'}
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Cash Flow' },
        ]}
        actions={data ? <ExportMenu payload={buildCashFlowExport(data)} /> : undefined}
      />

      <div className="flex flex-wrap items-end gap-4">
        <Suspense>
          <ReportFilterBar variant="ledger-period-range" ledgers={filterData.ledgers} periods={filterData.periods} defaults={{ ledgerId, fromPeriodId, toPeriodId }} />
        </Suspense>
        <Suspense><ReportSavedViews moduleKey="cash-flow" /></Suspense>
      </div>

      {(!ledgerId || !fromPeriodId || !toPeriodId) && (
        <EmptyState contentKey="finance.reports.cashFlow" variant="firstRun" icon={Banknote} />
      )}

      { data ? <CashFlowDisplay data={data} /> : null}
    </div>
  );
}
