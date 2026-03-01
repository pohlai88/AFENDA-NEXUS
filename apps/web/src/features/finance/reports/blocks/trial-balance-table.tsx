'use client';

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
import type { TrialBalanceRow } from '@/features/finance/reports/queries/report.queries';

interface TrialBalanceTableProps {
  rows: TrialBalanceRow[];
  totalDebit: string;
  totalCredit: string;
}

export function TrialBalanceTable({ rows, totalDebit, totalCredit }: TrialBalanceTableProps) {
  return (
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
          {rows.map((row) => (
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
  );
}
