import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { MoneyCell } from '@/components/erp/money-cell';
import type { JournalLineView } from '../queries/journal.queries';

interface JournalLinesTableProps {
  lines: JournalLineView[];
  currency: string;
  totalDebit: string;
  totalCredit: string;
}

export function JournalLinesTable({
  lines,
  currency,
  totalDebit,
  totalCredit,
}: JournalLinesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Journal line items</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-mono text-sm">
                {line.accountCode}
                {line.accountName && (
                  <span className="ml-2 text-muted-foreground">{line.accountName}</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{line.description ?? '—'}</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.debit} currency={line.currency} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={line.credit} currency={line.currency} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-medium">
            <TableCell colSpan={2} className="text-right text-xs text-muted-foreground">
              Totals
            </TableCell>
            <TableCell className="text-right">
              <MoneyCell amount={totalDebit} currency={currency} />
            </TableCell>
            <TableCell className="text-right">
              <MoneyCell amount={totalCredit} currency={currency} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
