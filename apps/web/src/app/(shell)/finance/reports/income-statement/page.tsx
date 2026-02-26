import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { MoneyCell } from '@/components/erp/money-cell';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import {
  getIncomeStatement,
  type ReportSection,
} from '@/features/finance/reports/queries/report.queries';
import { buildIncomeStatementExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
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
import { TrendingUp } from 'lucide-react';

export const metadata = { title: 'Income Statement' };

interface IncomeStatementPageProps {
  searchParams: Promise<{
    ledgerId?: string;
    fromPeriodId?: string;
    toPeriodId?: string;
  }>;
}

export default async function IncomeStatementPage({ searchParams }: IncomeStatementPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const ledgerId = params.ledgerId ?? '';
  const fromPeriodId = params.fromPeriodId ?? '';
  const toPeriodId = params.toPeriodId ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    ledgerId && fromPeriodId && toPeriodId
      ? getIncomeStatement(ctx, { ledgerId, fromPeriodId, toPeriodId })
      : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load income statement');
  }

  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income Statement"
        description={
          data?.periodRange
            ? `Revenue and expenses for ${data.periodRange}.`
            : 'Revenue and expenses over a period.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Income Statement' },
        ]}
        actions={data ? <ExportMenu payload={buildIncomeStatementExport(data)} /> : undefined}
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
          description="Choose a ledger and period range to generate the income statement."
          icon={TrendingUp}
        />
      )}

      {/* Report sections */}
      {data && (
        <div className="space-y-6">
          <ReportSectionTable section={data.revenue} />
          <ReportSectionTable section={data.expenses} />

          {/* Net Income summary */}
          <div className="rounded-md border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Net Income</span>
              <MoneyCell amount={data.netIncome} className="text-base font-bold" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable report section table ──────────────────────────────────────────

function ReportSectionTable({ section }: { section: ReportSection }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>{section.label}</TableHead>
            <TableHead className="text-right w-[160px]">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {section.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-12 text-center text-muted-foreground">
                No accounts in this section.
              </TableCell>
            </TableRow>
          ) : (
            section.rows.map((row) => (
              <TableRow key={row.accountCode}>
                <TableCell className="font-mono text-xs">{row.accountCode}</TableCell>
                <TableCell>{row.accountName}</TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={row.balance} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell colSpan={2}>Total {section.label}</TableCell>
            <TableCell className="text-right">
              <MoneyCell amount={section.total} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
