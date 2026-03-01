import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  ProvisionView,
  ProvisionMovementView,
} from '@/features/finance/provisions/queries/provisions.queries';
import {
  provisionTypeLabels,
  provisionStatusConfig,
} from '@/features/finance/provisions/types';

export function ProvisionDetailHeader({ provision }: { provision: ProvisionView }) {
  const statusCfg = provisionStatusConfig[provision.status as keyof typeof provisionStatusConfig];
  const typeLabel = provisionTypeLabels[provision.type as keyof typeof provisionTypeLabels] ?? provision.type;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{provision.name}</h2>
          {statusCfg && (
            <Badge className={statusCfg.color}>
              {statusCfg.label}
            </Badge>
          )}
          <Badge variant="secondary">{typeLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{provision.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <KPI label="Current Balance" value={`${provision.currentBalance.toLocaleString()} ${provision.currency}`} />
        <KPI label="Initial Amount" value={`${provision.initialAmount.toLocaleString()} ${provision.currency}`} />
        {provision.isDiscounted && (
          <KPI label="Present Value" value={`${provision.presentValue?.toLocaleString()} ${provision.currency}`} />
        )}
      </div>
    </div>
  );
}

export function ProvisionOverview({ provision }: { provision: ProvisionView }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Recognition Date" value={provision.recognitionDate} />
        <Field label="Expected Settlement" value={provision.expectedSettlementDate ?? '—'} />
        <Field label="GL Account" value={provision.glAccountCode} mono />
      </div>
      <div className="space-y-4">
        <Field label="Utilization YTD" value={`${provision.utilizationYTD.toLocaleString()} ${provision.currency}`} />
        <Field label="Additions YTD" value={`${provision.additionsYTD.toLocaleString()} ${provision.currency}`} />
        {provision.isDiscounted && <Field label="Discount Rate" value={`${provision.discountRate}%`} />}
        {provision.contingentLiability && <Field label="Contingency Note" value={provision.contingencyNote ?? '—'} />}
      </div>
    </div>
  );
}

export function ProvisionMovementsList({ movements }: { movements: ProvisionMovementView[] }) {
  if (movements.length === 0)
    return <p className="text-sm text-muted-foreground">No movements recorded.</p>;

  return (
    <div className="space-y-3">
      {movements.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div>
            <p className="font-medium capitalize">{m.movementType.replace('_', ' ')}</p>
            <p className="text-xs text-muted-foreground">{m.description}</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold">
              {m.amount >= 0 ? '+' : ''}{m.amount.toLocaleString()} {m.currency}
            </p>
            <p className="text-xs text-muted-foreground">{m.movementDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
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
