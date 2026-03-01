import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getApAging } from '@/features/finance/reports/queries/report.queries';
import { buildApAgingExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { ApAgingTable } from '@/features/finance/reports/blocks/ap-aging-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'AP Aging' };

interface ApAgingPageProps {
  searchParams: Promise<{
    asOfDate?: string;
    currency?: string;
  }>;
}

export default async function ApAgingPage({ searchParams }: ApAgingPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const asOfDate = params.asOfDate ?? '';
  const currency = params.currency ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    asOfDate ? getApAging(ctx, { asOfDate }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load AP aging report');
  }

  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AP Aging"
        description={
          data?.asOfDate
            ? `Accounts payable aging as of ${data.asOfDate}.`
            : 'Accounts payable aging by supplier.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'AP Aging' },
        ]}
        actions={data ? <ExportMenu payload={buildApAgingExport(data)} /> : undefined}
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
          <ReportSavedViews moduleKey="ap-aging" />
        </Suspense>
      </div>

      {!asOfDate && <EmptyState contentKey="finance.reports.apAging" variant="firstRun" icon={BarChart3} />}

      {data && <ApAgingTable data={data} />}
    </div>
  );
}
