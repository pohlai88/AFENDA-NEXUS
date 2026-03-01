import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  DeferredTaxItemView,
  DeferredTaxMovementView,
} from '@/features/finance/deferred-tax/queries/deferred-tax.queries';
import {
  deferredTaxTypeLabels,
  originTypeLabels,
  itemStatusConfig,
} from '@/features/finance/deferred-tax/types';

export function DeferredTaxDetailHeader({ item }: { item: DeferredTaxItemView }) {
  const typeLabel = deferredTaxTypeLabels[item.type as keyof typeof deferredTaxTypeLabels] ?? item.type;
  const originLabel = originTypeLabels[item.originType as keyof typeof originTypeLabels] ?? item.originType;
  const statusCfg = itemStatusConfig[item.status as keyof typeof itemStatusConfig];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{item.description}</h2>
          {statusCfg && (
            <Badge variant={statusCfg.color === 'green' ? 'default' : statusCfg.color === 'red' ? 'destructive' : 'secondary'}>
              {statusCfg.label}
            </Badge>
          )}
          <Badge variant="outline">{typeLabel}</Badge>
          <Badge variant="secondary">{originLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.jurisdiction} · Rate: {item.taxRate}%</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Temporary Difference</p>
          <p className="text-sm font-semibold">{item.temporaryDifference.toLocaleString()} {item.currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">DT Amount</p>
          <p className={cn('text-sm font-semibold', item.deferredTaxAmount >= 0 ? 'text-success' : 'text-destructive')}>
            {item.deferredTaxAmount.toLocaleString()} {item.currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">GL Account</p>
          <p className="text-sm font-mono">{item.glAccountCode}</p>
        </div>
      </div>
    </div>
  );
}

export function DeferredTaxOverview({ item }: { item: DeferredTaxItemView }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Book Basis" value={`${item.bookBasis.toLocaleString()} ${item.currency}`} />
        <Field label="Tax Basis" value={`${item.taxBasis.toLocaleString()} ${item.currency}`} />
        <Field label="Originating Period" value={item.originatingPeriod} />
        <Field label="Expected Reversal" value={item.expectedReversalPeriod ?? '—'} />
      </div>
      <div className="space-y-4">
        <Field label="Source Type" value={item.sourceType ?? '—'} />
        <Field label="Source ID" value={item.sourceId ?? '—'} mono />
        <Field label="Created" value={item.createdAt} />
        <Field label="Last Updated" value={item.updatedAt} />
      </div>
    </div>
  );
}

export function DeferredTaxMovements({ movements }: { movements: DeferredTaxMovementView[] }) {
  if (movements.length === 0)
    return <p className="text-sm text-muted-foreground">No movements recorded.</p>;

  return (
    <div className="space-y-3">
      {movements.map((m) => (
        <div key={m.id} className="grid grid-cols-4 gap-4 rounded-md border p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Period End</p>
            <p className="font-medium">{m.periodEnd}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Opening</p>
            <p className="font-mono">{m.openingBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Additions / Reversals</p>
            <p className="font-mono">{m.additions.toLocaleString()} / {m.reversals.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Closing</p>
            <p className="font-mono font-semibold">{m.closingBalance.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className={cn('mt-1 text-sm', mono && 'font-mono')}>{value}</p>
    </div>
  );
}
