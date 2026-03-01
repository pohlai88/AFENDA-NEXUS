import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BudgetEntryListItem } from '../queries/budget.queries';

interface BudgetEntryTableProps {
  entries: BudgetEntryListItem[];
}

export function BudgetEntryTable({ entries }: BudgetEntryTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Budget entries</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Budget Amount</TableHead>
            <TableHead className="text-right">Version</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <div className="font-medium">{entry.accountCode}</div>
                {entry.accountName && (
                  <div className="text-xs text-muted-foreground">{entry.accountName}</div>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {entry.periodName ?? entry.periodId}
              </TableCell>
              <TableCell className="text-right font-mono">
                {Number(entry.budgetAmount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                v{entry.version}
                {entry.versionNote && (
                  <span className="ml-1 text-xs">({entry.versionNote})</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
