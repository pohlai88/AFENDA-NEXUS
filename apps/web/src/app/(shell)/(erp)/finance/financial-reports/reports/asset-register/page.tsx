import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getAssetRegister } from '@/features/finance/reports/queries/report.queries';
import { buildAssetRegisterExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { AssetRegisterTable } from '@/features/finance/reports/blocks/asset-register-table';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Asset Register' };

interface AssetRegisterPageProps {
  searchParams: Promise<{
    asOfDate?: string;
    currency?: string;
  }>;
}

export default async function AssetRegisterPage({ searchParams }: AssetRegisterPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  const asOfDate = params.asOfDate ?? '';
  const currency = params.currency ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    asOfDate ? getAssetRegister(ctx, { asOfDate }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load asset register');
  }

  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixed Asset Register"
        description={
          data?.asOfDate
            ? `Fixed assets as of ${data.asOfDate}.`
            : 'Complete list of fixed assets with depreciation.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Asset Register' },
        ]}
        actions={data ? <ExportMenu payload={buildAssetRegisterExport(data)} /> : undefined}
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
          <ReportSavedViews moduleKey="asset-register" />
        </Suspense>
      </div>

      {!asOfDate && <EmptyState contentKey="finance.reports.assetRegister" variant="firstRun" icon={BarChart3} />}

      { data ? <AssetRegisterTable data={data} /> : null}
    </div>
  );
}
