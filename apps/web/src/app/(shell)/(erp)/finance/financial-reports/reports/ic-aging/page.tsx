import { Suspense } from 'react';
import type { RequestContext } from '@afenda/core';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildIcAgingExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { getIcAging } from '@/features/finance/intercompany/queries/ic.queries';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { IcAgingTable } from '@/features/finance/intercompany/blocks/ic-aging-table';
import { ArrowLeftRight } from 'lucide-react';

export const metadata = { title: 'IC Aging Report' };

interface IcAgingPageProps {
  searchParams: Promise<{ currency?: string; asOfDate?: string }>;
}

async function IcAgingContent({
  ctx,
  currency,
  asOfDate,
}: {
  ctx: RequestContext;
  currency: string;
  asOfDate: string;
}) {
  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    currency && asOfDate ? getIcAging(ctx, { currency, asOfDate }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) handleApiError(result, 'Failed to load IC aging report');
  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intercompany Aging"
        description={
          data?.asOfDate
            ? `Intercompany balances aging as of ${data.asOfDate}.`
            : 'Analyze aging of intercompany balances by counterparty.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'IC Aging' },
        ]}
        actions={data ? <ExportMenu payload={buildIcAgingExport(data)} /> : undefined}
      />

      <div className="flex flex-wrap items-end gap-4">
        <Suspense>
          <ReportFilterBar
            variant="currency-date"
            currencies={filterData.currencies}
            defaults={{ currency, asOfDate }}
          />
        </Suspense>
        <Suspense>
          <ReportSavedViews moduleKey="ic-aging" />
        </Suspense>
      </div>

      {(!currency || !asOfDate) && (
        <EmptyState
          contentKey="finance.reports.icAging"
          constraint="page"
          variant="firstRun"
          icon={ArrowLeftRight}
        />
      )}

      {data && data.rows.length === 0 && (
        <EmptyState
          contentKey="finance.reports.icAging"
          constraint="page"
          variant="noResults"
          icon={ArrowLeftRight}
        />
      )}

      {data && data.rows.length > 0 && (
        <IcAgingTable
          rows={data.rows.map((r) => ({
            ...r,
            current: Number(r.current),
            days30: Number(r.days30),
            days60: Number(r.days60),
            days90Plus: Number(r.days90Plus),
            total: Number(r.total),
          }))}
          currency={data.currency}
          grandTotal={Number(data.grandTotal)}
        />
      )}
    </div>
  );
}

export default async function IcAgingPage({ searchParams }: IcAgingPageProps) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);
  const currency = params.currency ?? '';
  const asOfDate = params.asOfDate ?? '';

  return (
    <Suspense>
      <IcAgingContent ctx={ctx} currency={currency} asOfDate={asOfDate} />
    </Suspense>
  );
}
