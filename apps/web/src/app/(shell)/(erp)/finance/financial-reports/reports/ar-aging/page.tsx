import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getArAging } from '@/features/finance/reports/queries/report.queries';
import { buildArAgingExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { ArAgingTable } from '@/features/finance/reports/blocks/ar-aging-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'AR Aging' };

interface ArAgingPageProps {
  searchParams: Promise<{
    asOfDate?: string;
    currency?: string;
  }>;
}

export default async function ArAgingPage({ searchParams }: ArAgingPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  const asOfDate = params.asOfDate ?? '';
  const currency = params.currency ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    asOfDate ? getArAging(ctx, { asOfDate }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load AR aging report');
  }

  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AR Aging"
        description={
          data?.asOfDate
            ? `Accounts receivable aging as of ${data.asOfDate}.`
            : 'Accounts receivable aging by customer.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'AR Aging' },
        ]}
        actions={data ? <ExportMenu payload={buildArAgingExport(data)} /> : undefined}
      />

      <div className="flex flex-wrap items-end gap-4">
        <Suspense>
          <ReportFilterBar
            variant="currency-date"
            currencies={filterData.currencies}
            defaults={{ asOfDate, currency }}
          />
        </Suspense>
        <Suspense>
          <ReportSavedViews moduleKey="ar-aging" />
        </Suspense>
      </div>

      {!asOfDate && <EmptyState contentKey="finance.reports.arAging" variant="firstRun" icon={BarChart3} />}

      { data ? <ArAgingTable data={data} /> : null}
    </div>
  );
}
