import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Recurring Summary Bar ──────────────────────────────────────────────────

interface RecurringSummaryBarProps {
  isActive: boolean;
  frequency: string;
  nextRunDate: string;
  ledgerName: string | null;
  ledgerId: string;
  createdAt: string;
}

export function RecurringSummaryBar({
  isActive,
  frequency,
  nextRunDate,
  ledgerName,
  ledgerId,
  createdAt,
}: RecurringSummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-md border p-4">
      <div>
        <span className="text-xs text-muted-foreground">Status</span>
        <div className="mt-1">
          <StatusBadge status={isActive ? 'OPEN' : 'CLOSED'} />
        </div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Frequency</span>
        <div className="mt-1">
          <Badge variant="outline">{frequency}</Badge>
        </div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Next Run</span>
        <div className="mt-1 text-sm">
          <DateCell date={nextRunDate} format="medium" />
        </div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Ledger</span>
        <div className="mt-1 text-sm font-medium">{ledgerName ?? ledgerId}</div>
      </div>
      <Separator orientation="vertical" className="hidden h-10 sm:block" />
      <div>
        <span className="text-xs text-muted-foreground">Created</span>
        <div className="mt-1 text-sm">
          <DateCell date={createdAt} format="medium" />
        </div>
      </div>
    </div>
  );
}

// ─── Template Lines Table ───────────────────────────────────────────────────

interface TemplateLine {
  accountCode: string;
  description?: string | null;
  debit: string | number;
  credit: string | number;
}

export function RecurringLinesTable({ lines }: { lines: TemplateLine[] }) {
  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Template Lines</h3>
      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Recurring journal template lines</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="col-account">Account Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="col-amount text-right">Debit</TableHead>
              <TableHead className="col-amount text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, i) => (
              // eslint-disable-next-line react/no-array-index-key -- Lines may share accountCode
              <TableRow key={`${line.accountCode}-${i}`}>
                <TableCell className="font-mono text-xs">{line.accountCode}</TableCell>
                <TableCell className="text-muted-foreground">{line.description ?? '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : ''}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : ''}
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
