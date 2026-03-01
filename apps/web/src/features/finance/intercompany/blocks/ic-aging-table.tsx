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

interface IcAgingRow {
  companyId: string;
  companyName: string;
  counterpartyId: string;
  counterpartyName: string;
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
  total: number;
}

interface IcAgingTableProps {
  rows: IcAgingRow[];
  currency: string;
  grandTotal: number;
}

export function IcAgingTable({ rows, currency, grandTotal }: IcAgingTableProps) {
  return (
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
          {rows.map((row, i) => (
            <DrilldownRow
              key={`${row.companyId}-${row.counterpartyId}-${i}`}
              href={`${routes.finance.icTransactions}?companyId=${row.companyId}&counterpartyId=${row.counterpartyId}`}
            >
              <TableCell className="font-medium">{row.companyName}</TableCell>
              <TableCell>{row.counterpartyName}</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={row.current} currency={currency} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={row.days30} currency={currency} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={row.days60} currency={currency} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={row.days90Plus} currency={currency} />
              </TableCell>
              <TableCell className="text-right font-semibold">
                <MoneyCell amount={row.total} currency={currency} />
              </TableCell>
            </DrilldownRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6} className="font-semibold">
              Grand Total
            </TableCell>
            <TableCell className="text-right font-bold">
              <MoneyCell amount={grandTotal} currency={currency} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
