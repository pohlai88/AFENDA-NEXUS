import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import type { RequestContext } from '@afenda/core';
import { handleApiError } from '@/lib/api-error.server';
import { getTrialBalance } from '@/features/finance/reports/queries/report.queries';
import { buildTrialBalanceExport } from '@/features/finance/reports/actions/report-export.actions';
import { TrialBalanceFilters } from '@/features/finance/reports/blocks/trial-balance-filters';
import { TrialBalanceTable } from '@/features/finance/reports/blocks/trial-balance-table';
import { routes } from '@/lib/constants';
import { Scale } from 'lucide-react';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';

export const metadata = { title: 'Trial Balance' };

type Params = { ledgerId?: string; year?: string; period?: string };

async function TrialBalanceContent({ ctx, params }: { ctx: RequestContext; params: Params }) {
  const year = params.year ?? new Date().getFullYear().toString();
  const ledgerId = params.ledgerId ?? '';

  const result = ledgerId
    ? await getTrialBalance(ctx, { ledgerId, year, period: params.period })
    : null;

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load trial balance');
  }

  const rows = result?.value.rows ?? [];
  const totalDebit = result?.value.totalDebit ?? '0';
  const totalCredit = result?.value.totalCredit ?? '0';
  const asOfDate = result?.value.asOfDate ?? '';
  const tbData = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trial Balance"
        description={
          asOfDate
            ? `Account balances as of ${asOfDate}.`
            : 'Account balances for the selected period.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Trial Balance' },
        ]}
        actions={tbData ? <ExportMenu payload={buildTrialBalanceExport(tbData)} /> : undefined}
      />

      <TrialBalanceFilters currentYear={year} currentPeriod={params.period} ledgerId={ledgerId} />

      {!ledgerId && (
        <EmptyState
          contentKey="finance.reports.trialBalance"
          constraint="page"
          variant="noSelection"
          icon={Scale}
        />
      )}

      {ledgerId && rows.length > 0 && (
        <TrialBalanceTable rows={rows} totalDebit={totalDebit} totalCredit={totalCredit} />
      )}

      {ledgerId && rows.length === 0 && (
        <EmptyState
          contentKey="finance.reports.trialBalance"
          constraint="page"
          variant="noResults"
          icon={Scale}
        />
      )}
    </div>
  );
}

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const [params, ctx] = await Promise.all([searchParams, getRequestContext()]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>\n      <TrialBalanceContent ctx={ctx} params={params} />\n    </Suspense>
  );
}

        {!ledgerId && (
          <EmptyState
            contentKey="finance.reports.trialBalance"
            constraint="page"
            variant="firstRun"
            icon={Scale}
          />
        )}

        {ledgerId && rows.length > 0 && (
          <TrialBalanceTable rows={rows} totalDebit={totalDebit} totalCredit={totalCredit} />
        )}

        {ledgerId && rows.length === 0 && (
          <EmptyState
            contentKey="finance.reports.trialBalance"
            constraint="page"
            variant="noResults"
            icon={Scale}
          />
        )}
      </div>
    </Suspense>
  );
}
