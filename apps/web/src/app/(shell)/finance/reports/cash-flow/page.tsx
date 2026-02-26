import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { MoneyCell } from '@/components/erp/money-cell';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { getCashFlow } from '@/features/finance/reports/queries/report.queries';
import { buildCashFlowExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { Banknote } from 'lucide-react';

export const metadata = { title: 'Cash Flow Statement' };

interface CashFlowPageProps {
  searchParams: Promise<{
    ledgerId?: string;
    fromPeriodId?: string;
    toPeriodId?: string;
  }>;
}

export default async function CashFlowPage({ searchParams }: CashFlowPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const ledgerId = params.ledgerId ?? '';
  const fromPeriodId = params.fromPeriodId ?? '';
  const toPeriodId = params.toPeriodId ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    ledgerId && fromPeriodId && toPeriodId
      ? getCashFlow(ctx, { ledgerId, fromPeriodId, toPeriodId })
      : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load cash flow statement');
  }

  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Flow Statement"
        description={
          data?.periodRange
            ? `Cash flows for ${data.periodRange}.`
            : 'Operating, investing, and financing activities.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Cash Flow' },
        ]}
        actions={data ? <ExportMenu payload={buildCashFlowExport(data)} /> : undefined}
      />

      <Suspense>
        <ReportFilterBar
          variant="ledger-period-range"
          ledgers={filterData.ledgers}
          periods={filterData.periods}
          defaults={{ ledgerId, fromPeriodId, toPeriodId }}
        />
      </Suspense>

      {/* No params */}
      {(!ledgerId || !fromPeriodId || !toPeriodId) && (
        <EmptyState
          title="Select parameters"
          description="Choose a ledger and period range to generate the cash flow statement."
          icon={Banknote}
        />
      )}

      {/* Cash flow sections */}
      {data && (
        <div className="space-y-4">
          <CashFlowRow label="Operating Activities" amount={data.operatingActivities} />
          <CashFlowRow label="Investing Activities" amount={data.investingActivities} />
          <CashFlowRow label="Financing Activities" amount={data.financingActivities} />

          {/* Net cash flow */}
          <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Net Cash Flow</span>
              <MoneyCell amount={data.netCashFlow} className="text-base font-bold" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cash flow row ──────────────────────────────────────────────────────────

function CashFlowRow({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <MoneyCell amount={amount} className="font-semibold" />
      </div>
    </div>
  );
}
