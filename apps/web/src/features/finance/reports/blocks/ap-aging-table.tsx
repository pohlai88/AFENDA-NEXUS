import { MoneyCell } from '@/components/erp/money-cell';
import { DrilldownRow } from '@/components/erp/drilldown';
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

interface ApAgingRow {
  supplierId: string;
  supplierName: string;
  invoiceCount: number;
  current: string;
  days30: string;
  days60: string;
  days90: string;
  over90: string;
  total: string;
}

interface ApAgingData {
  rows: ApAgingRow[];
  totals: {
    current: string;
    days30: string;
    days60: string;
    days90: string;
    over90: string;
    total: string;
  };
}

export function ApAgingTable({ data }: { data: ApAgingData }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Accounts payable aging report</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right w-[80px]">Invoices</TableHead>
            <TableHead className="text-right w-[120px]">Current</TableHead>
            <TableHead className="text-right w-[120px]">1-30 Days</TableHead>
            <TableHead className="text-right w-[120px]">31-60 Days</TableHead>
            <TableHead className="text-right w-[120px]">61-90 Days</TableHead>
            <TableHead className="text-right w-[120px]">90+ Days</TableHead>
            <TableHead className="text-right w-[120px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-12 text-center text-muted-foreground">
                No outstanding payables found.
              </TableCell>
            </TableRow>
          ) : (
            data.rows.map((row) => (
              <DrilldownRow key={row.supplierId} href={routes.finance.supplierDetail(row.supplierId)}>
                <TableCell className="font-medium">{row.supplierName}</TableCell>
                <TableCell className="text-right">{row.invoiceCount}</TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.current} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.days30} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.days60} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.days90} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.over90} /></TableCell>
                <TableCell className="text-right"><MoneyCell amount={row.total} /></TableCell>
              </DrilldownRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell>Total</TableCell>
            <TableCell />
            <TableCell className="text-right"><MoneyCell amount={data.totals.current} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totals.days30} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totals.days60} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totals.days90} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totals.over90} /></TableCell>
            <TableCell className="text-right"><MoneyCell amount={data.totals.total} /></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
