import { cn } from '@/lib/utils';
import { MoneyCell } from '@/components/erp/money-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EquityRow {
  description: string;
  shareCapital: string;
  retainedEarnings: string;
  otherReserves: string;
  nci: string;
  total: string;
}

interface EquityStatementData {
  openingBalance: EquityRow;
  rows: EquityRow[];
  closingBalance: EquityRow;
}

function EquityDataRow({ row, className }: { row: EquityRow; className?: string }) {
  return (
    <TableRow className={cn(className)}>
      <TableCell className="font-medium">{row.description}</TableCell>
      <TableCell className="text-right"><MoneyCell amount={row.shareCapital} /></TableCell>
      <TableCell className="text-right"><MoneyCell amount={row.retainedEarnings} /></TableCell>
      <TableCell className="text-right"><MoneyCell amount={row.otherReserves} /></TableCell>
      <TableCell className="text-right"><MoneyCell amount={row.nci} /></TableCell>
      <TableCell className="text-right font-semibold"><MoneyCell amount={row.total} /></TableCell>
    </TableRow>
  );
}

export function EquityStatementTable({ data }: { data: EquityStatementData }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Statement of changes in equity</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right w-[130px]">Share Capital</TableHead>
            <TableHead className="text-right w-[130px]">Retained Earnings</TableHead>
            <TableHead className="text-right w-[130px]">Other Reserves</TableHead>
            <TableHead className="text-right w-[100px]">NCI</TableHead>
            <TableHead className="text-right w-[130px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <EquityDataRow row={data.openingBalance} className="bg-muted/30" />
          {data.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-12 text-center text-muted-foreground">
                No movements found.
              </TableCell>
            </TableRow>
          ) : (
            data.rows.map((row) => (
              <EquityDataRow key={row.description} row={row} />
            ))
          )}
        </TableBody>
        <TableFooter>
          <EquityDataRow row={data.closingBalance} className="font-semibold" />
        </TableFooter>
      </Table>
    </div>
  );
}
