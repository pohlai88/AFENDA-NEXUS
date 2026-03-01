import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildBudgetVarianceExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import type { ApiResult } from '@/lib/types';
import {
  getBudgetVariance,
  getVarianceAlerts,
  type BudgetVarianceResult,
  type VarianceAlertsResult,
} from '@/features/finance/budgets/queries/budget.queries';
import { ReportFilterBar } from '@/features/finance/reports/blocks/report-filter-bar';
import { getReportFilterData } from '@/features/finance/reports/blocks/report-filter-data';
import { ReportSavedViews } from '@/features/finance/reports/blocks/report-saved-views';
import { VarianceAlertsPanel, BudgetVarianceTable } from '@/features/finance/budgets/blocks/budget-variance-blocks';
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Budget Variance Report' };

interface BudgetVariancePageProps {
  searchParams: Promise<{ ledgerId?: string; periodId?: string }>;
}

export default async function BudgetVariancePage({ searchParams }: BudgetVariancePageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();
  const ledgerId = params.ledgerId ?? '';
  const periodId = params.periodId ?? '';

  const [filterData, ...reportResults] = await Promise.all([
    getReportFilterData(),
    ...(ledgerId && periodId
      ? [getBudgetVariance(ctx, { ledgerId, periodId }), getVarianceAlerts(ctx, { ledgerId, periodId })]
      : []),
  ]);

  const varianceResult = (reportResults[0] ?? null) as ApiResult<BudgetVarianceResult> | null;
  const alertsResult = (reportResults[1] ?? null) as ApiResult<VarianceAlertsResult> | null;
  if (varianceResult && !varianceResult.ok) handleApiError(varianceResult, 'Failed to load budget variance');
  if (alertsResult && !alertsResult.ok) handleApiError(alertsResult, 'Failed to load variance alerts');

  const data = varianceResult?.ok ? varianceResult.value : null;
  const alerts = alertsResult?.ok ? alertsResult.value : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Variance"
        description={data ? 'Budget vs. actual analysis by account.' : 'Compare budgeted amounts against actual postings.'}
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Budget Variance' },
        ]}
        actions={data ? <ExportMenu payload={buildBudgetVarianceExport(data)} /> : undefined}
      />

      <div className="flex flex-wrap items-end gap-4">
        <Suspense>
          <ReportFilterBar variant="ledger-period" ledgers={filterData.ledgers} periods={filterData.periods} defaults={{ ledgerId, periodId }} />
        </Suspense>
        <Suspense>
          <ReportSavedViews moduleKey="budget-variance" />
        </Suspense>
      </div>

      {(!ledgerId || !periodId) && <EmptyState contentKey="finance.reports.budgetVariance" variant="firstRun" icon={BarChart3} />}
      {alerts && <VarianceAlertsPanel alerts={alerts.alerts} />}
      {data && data.rows.length === 0 && <EmptyState contentKey="finance.reports.budgetVariance" variant="noResults" icon={BarChart3} />}
      {data && data.rows.length > 0 && (
        <BudgetVarianceTable rows={data.rows.map(r => ({ accountId: r.accountId, accountCode: r.accountCode, accountName: r.accountName, budgetAmount: Number(r.budgetAmount), actualAmount: Number(r.actualAmount), variance: Number(r.variance), variancePct: r.variancePct }))} totalBudget={Number(data.totalBudget)} totalActual={Number(data.totalActual)} totalVariance={Number(data.totalVariance)} />
      )}
    </div>
  );
}
