import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import { MoneyCell } from '@/components/erp/money-cell';
import type { JournalDetail } from '../queries/journal.queries';

interface JournalDetailHeaderProps {
  journal: JournalDetail;
}

export function JournalDetailHeader({ journal }: JournalDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono">{journal.documentNumber}</h2>
          <p className="text-sm text-muted-foreground">{journal.description}</p>
        </div>
        <StatusBadge status={journal.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Posting Date</dt>
          <dd className="mt-1">
            <DateCell date={journal.postingDate} format="medium" />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Currency</dt>
          <dd className="mt-1 text-sm font-medium">{journal.currency}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Total Debit</dt>
          <dd className="mt-1">
            <MoneyCell amount={journal.totalDebit} currency={journal.currency} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Total Credit</dt>
          <dd className="mt-1">
            <MoneyCell amount={journal.totalCredit} currency={journal.currency} />
          </dd>
        </div>
      </div>

      {journal.reversedById && (
        <div className="rounded-md border border-border bg-muted p-3 text-sm">
          <strong>Reversed</strong> by journal{' '}
          <span className="font-mono">{journal.reversedById}</span>
        </div>
      )}

      {journal.voidReason && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm">
          <strong>Voided:</strong> {journal.voidReason}
        </div>
      )}
    </div>
  );
}
