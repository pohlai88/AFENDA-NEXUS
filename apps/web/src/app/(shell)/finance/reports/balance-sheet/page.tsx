import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { MoneyCell } from '@/components/erp/money-cell';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import {
  getBalanceSheet,
  type ReportSection,
} from '@/features/finance/reports/queries/report.queries';
import { buildBalanceSheetExport } from '@/features/finance/reports/actions/report-export.actions';
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
import { BarChart3 } from 'lucide-react';

export const metadata = { title: 'Balance Sheet' };

interface BalanceSheetPageProps {
  searchParams: Promise<{
    ledgerId?: string;
    periodId?: string;
  }>;
}

export default async function BalanceSheetPage({ searchParams }: BalanceSheetPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const ledgerId = params.ledgerId ?? '';
  const periodId = params.periodId ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    ledgerId && periodId ? getBalanceSheet(ctx, { ledgerId, periodId }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load balance sheet');
  }

  const data = result?.value ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balance Sheet"
        description={
          data?.asOfDate
            ? `Assets, liabilities, and equity as of ${data.asOfDate}.`
            : 'Assets, liabilities, and equity at a point in time.'
        }
        breadcrumbs={[
          { label: 'Finance', href: routes.finance.journals },
          { label: 'Reports', href: routes.finance.reports },
          { label: 'Balance Sheet' },
        ]}
        actions={data ? <ExportMenu payload={buildBalanceSheetExport(data)} /> : undefined}
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
          contentKey="finance.reports.balanceSheet"
          variant="firstRun"
          icon={BarChart3}
        />
      )}

      {/* Balance check */}
      {data && !data.isBalanced && (
        <div
          className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning"
          role="alert"
        >
          Warning: Balance sheet is out of balance. Assets do not equal Liabilities + Equity.
        </div>
      )}

      {/* Report sections */}
      {data && (
        <div className="space-y-6">
          <ReportSectionTable section={data.assets} />
          <ReportSectionTable section={data.liabilities} />
          <ReportSectionTable section={data.equity} />
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
        <caption className="sr-only">Balance sheet section</caption>
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
