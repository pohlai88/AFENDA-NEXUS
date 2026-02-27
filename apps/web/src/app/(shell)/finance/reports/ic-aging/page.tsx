import { Suspense } from 'react';
import { PageHeader } from '@/components/erp/page-header';
import { ExportMenu } from '@/components/erp/export-menu';
import { EmptyState } from '@/components/erp/empty-state';
import { MoneyCell } from '@/components/erp/money-cell';
import { getRequestContext } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error.server';
import { buildIcAgingExport } from '@/features/finance/reports/actions/report-export.actions';
import { routes } from '@/lib/constants';
import { getIcAging } from '@/features/finance/intercompany/queries/ic.queries';
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
import { ArrowLeftRight } from 'lucide-react';

export const metadata = { title: 'IC Aging Report' };

interface IcAgingPageProps {
  searchParams: Promise<{
    currency?: string;
    asOfDate?: string;
  }>;
}

export default async function IcAgingPage({ searchParams }: IcAgingPageProps) {
  const params = await searchParams;
  const ctx = await getRequestContext();

  const currency = params.currency ?? '';
  const asOfDate = params.asOfDate ?? '';

  const [filterData, result] = await Promise.all([
    getReportFilterData(),
    currency && asOfDate ? getIcAging(ctx, { currency, asOfDate }) : Promise.resolve(null),
  ]);

  if (result && !result.ok) {
    handleApiError(result, 'Failed to load IC aging report');
  }

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

      <Suspense>
        <ReportFilterBar
          variant="currency-date"
          currencies={filterData.currencies}
          defaults={{ currency, asOfDate }}
        />
      </Suspense>

      {/* No params */}
      {(!currency || !asOfDate) && (
        <EmptyState
          contentKey="finance.reports.icAging"
          variant="firstRun"
          icon={ArrowLeftRight}
        />
      )}

      {/* Report table */}
      {data && data.rows.length === 0 && (
        <EmptyState
          contentKey="finance.reports.icAging"
          variant="noResults"
          icon={ArrowLeftRight}
        />
      )}

      {data && data.rows.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <caption className="sr-only">Intercompany aging report</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">1-30 Days</TableHead>
                <TableHead className="text-right">31-60 Days</TableHead>
                <TableHead className="text-right">90+ Days</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, i) => (
                <TableRow key={`${row.companyId}-${row.counterpartyId}-${i}`}>
                  <TableCell className="font-medium">{row.companyName}</TableCell>
                  <TableCell>{row.counterpartyName}</TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.current} currency={data.currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.days30} currency={data.currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.days60} currency={data.currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyCell amount={row.days90Plus} currency={data.currency} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <MoneyCell amount={row.total} currency={data.currency} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="font-semibold">
                  Grand Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  <MoneyCell amount={data.grandTotal} currency={data.currency} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
