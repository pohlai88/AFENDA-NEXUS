import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { MoneyCell } from '@/components/erp/money-cell';
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Budget Variance Report' };

interface BudgetVariancePageProps {
  searchParams: Promise<{
    ledgerId?: string;
    periodId?: string;
  }>;
}

function varianceColor(pct: number): string {
  if (Math.abs(pct) < 5) return 'text-muted-foreground';
  if (pct > 0) return 'text-green-600 dark:text-green-400';
  return 'text-red-600 dark:text-red-400';
}

function alertBadge(severity: 'WARNING' | 'CRITICAL') {
  return severity === 'CRITICAL' ? 'destructive' : ('outline' as const);
}

export default async function BudgetVariancePage({ searchParams }: BudgetVariancePageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const ledgerId = params.ledgerId ?? '';
  const periodId = params.periodId ?? '';

  const [filterData, ...reportResults] = await Promise.all([
    getReportFilterData(),
    ...(ledgerId && periodId
      ? [
        getBudgetVariance(ctx, { ledgerId, periodId }),
        getVarianceAlerts(ctx, { ledgerId, periodId }),
      ]
      : []),
  ]);

  const varianceResult = (reportResults[0] ?? null) as ApiResult<BudgetVarianceResult> | null;
  const alertsResult = (reportResults[1] ?? null) as ApiResult<VarianceAlertsResult> | null;

  if (varianceResult && !varianceResult.ok) {
    handleApiError(varianceResult, 'Failed to load budget variance');
  }
  if (alertsResult && !alertsResult.ok) {
    handleApiError(alertsResult, 'Failed to load variance alerts');
  }

  const data = varianceResult?.ok ? varianceResult.value : null;
  const alerts = alertsResult?.ok ? alertsResult.value : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Variance"
        description={
          data
            ? 'Budget vs. actual analysis by account.'
            : 'Compare budgeted amounts against actual postings.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Budget Variance' },
        ]}
        actions={data ? <ExportMenu payload={buildBudgetVarianceExport(data)} /> : undefined}
      />

      <Suspense>
        <ReportFilterBar
          variant="ledger-period"
          ledgers={filterData.ledgers}
          periods={filterData.periods}
          defaults={{ ledgerId, periodId }}
        />
      </Suspense>

      {/* No params */}
      {(!ledgerId || !periodId) && (
        <EmptyState
          contentKey="finance.reports.budgetVariance"
          variant="firstRun"
          icon={BarChart3}
        />
      )}

      {/* Variance alerts */}
      {alerts && alerts.alerts.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Variance Alerts ({alerts.alerts.length})
          </div>
          <div className="grid gap-2">
            {alerts.alerts.map((a, i) => (
              <div
                key={`${a.accountCode}-${i}`}
                className="flex items-center justify-between rounded border bg-background p-2 text-sm"
              >
                <span>
                  <span className="font-mono font-medium">{a.accountCode}</span> {a.accountName}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={alertBadge(a.severity)}>{a.severity}</Badge>
                  <span className={varianceColor(a.variancePct)}>
                    {a.variancePct > 0 ? '+' : ''}
                    {a.variancePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variance table */}
      {data && data.rows.length === 0 && (
        <EmptyState
          contentKey="finance.reports.budgetVariance"
          variant="noResults"
          icon={BarChart3}
        />
      )}

      {data && data.rows.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <caption className="sr-only">Budget variance report</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Variance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.accountCode}>
                  <TableCell>
                    <span className="font-mono text-muted-foreground">{row.accountCode}</span>{' '}
                    {row.accountName}
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.budgetAmount} currency="USD" />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.actualAmount} currency="USD" />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${varianceColor(row.variancePct)}`}>
                    <MoneyCell amount={row.variance} currency="USD" />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${varianceColor(row.variancePct)}`}>
                    {row.variancePct > 0 ? '+' : ''}
                    {row.variancePct.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-bold">
                  <MoneyCell amount={data.totalBudget} currency="USD" />
                </TableCell>
                <TableCell className="text-right font-bold">
                  <MoneyCell amount={data.totalActual} currency="USD" />
                </TableCell>
                <TableCell className="text-right font-bold">
                  <MoneyCell amount={data.totalVariance} currency="USD" />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
