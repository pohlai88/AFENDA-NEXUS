import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { MoneyCell } from '@/components/erp/money-cell';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import {
  getTrialBalance,
  type TrialBalanceRow,
} from '@/features/finance/reports/queries/report.queries';
import { buildTrialBalanceExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Scale } from 'lucide-react';

export const metadata = { title: 'Trial Balance' };

interface TrialBalancePageProps {
  searchParams: Promise<{
    ledgerId?: string;
    year?: string;
    period?: string;
  }>;
}

export default async function TrialBalancePage({ searchParams }: TrialBalancePageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  // Default to current year if not specified
  const year = params.year ?? new Date().getFullYear().toString();
  const ledgerId = params.ledgerId ?? '';

  const result = ledgerId
    ? await getTrialBalance(ctx, {
      ledgerId,
      year,
      period: params.period,
    })
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

      {/* Filter bar — server-rendered links */}
      <TrialBalanceFilters currentYear={year} currentPeriod={params.period} ledgerId={ledgerId} />

      {/* No ledger selected */}
      {!ledgerId && (
        <EmptyState
          contentKey="finance.reports.trialBalance"
          variant="firstRun"
          icon={Scale}
        />
      )}

      {/* Data table */}
      {ledgerId && rows.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <caption className="sr-only">Trial balance data</caption>
            <TableHeader>
              <TableRow>
                <TableHead className="col-account">Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="col-amount text-right">Debit</TableHead>
                <TableHead className="col-amount text-right">Credit</TableHead>
                <TableHead className="col-amount text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: TrialBalanceRow) => (
                <TableRow key={row.accountCode}>
                  <TableCell className="font-mono text-xs">{row.accountCode}</TableCell>
                  <TableCell>{row.accountName}</TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.debit} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.credit} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.balance} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell colSpan={2}>Totals</TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={totalDebit} />
                </TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={totalCredit} />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* Empty state — ledger selected but no data */}
      {ledgerId && rows.length === 0 && (
        <EmptyState
          contentKey="finance.reports.trialBalance"
          variant="noResults"
          icon={Scale}
        />
      )}
    </div>
  );
}

// ─── Filter bar (server-rendered links for zero JS) ─────────────────────────

function TrialBalanceFilters({
  currentYear,
  currentPeriod,
  ledgerId,
}: {
  currentYear: string;
  currentPeriod?: string;
  ledgerId: string;
}) {
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const periods = [
    { value: undefined, label: 'Full Year' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: `P${i + 1}`,
    })),
  ];

  function buildUrl(overrides: { year?: string; period?: string }) {
    const params = new URLSearchParams();
    if (ledgerId) params.set('ledgerId', ledgerId);
    const y = overrides.year ?? currentYear;
    if (y) params.set('year', y);
    const p = overrides.period ?? currentPeriod;
    if (p) params.set('period', p);
    const qs = params.toString();
    return qs ? `${routes.finance.trialBalance}?${qs}` : routes.finance.trialBalance;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Year selector */}
      <div className="flex gap-1">
        {years.map((y) => {
          const isActive = y === currentYear;
          return (
            <a
              key={y}
              href={buildUrl({ year: y, period: currentPeriod })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              {y}
            </a>
          );
        })}
      </div>

      {/* Period selector */}
      <div className="flex gap-1 overflow-x-auto">
        {periods.map((p) => {
          const isActive = p.value === currentPeriod || (!p.value && !currentPeriod);
          return (
            <a
              key={p.label}
              href={buildUrl({ year: currentYear, period: p.value })}
              className={`whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              {p.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
