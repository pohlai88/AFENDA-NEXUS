import { MoneyCell } from '@/components/erp/money-cell';
import type { IcJournalLineView } from '../queries/ic.queries';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── IC Journal Lines Table ─────────────────────────────────────────────────

export function IcLinesTable({ lines, title }: { lines: IcJournalLineView[]; title: string }) {
  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Intercompany transaction lines</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="w-[140px] text-right">Debit</TableHead>
              <TableHead className="w-[140px] text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{line.accountCode}</TableCell>
                <TableCell>{line.accountName ?? '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {Number(line.debit) > 0 ? line.debit : ''}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {Number(line.credit) > 0 ? line.credit : ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                {totalDebit.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                {totalCredit.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
