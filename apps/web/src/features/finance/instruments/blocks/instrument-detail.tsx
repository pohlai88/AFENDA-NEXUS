import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  InstrumentView as FinancialInstrumentView,
  FairValueMeasurementView as FairValueView,
} from '@/features/finance/instruments/queries/instruments.queries';
import {
  instrumentStatusConfig,
  instrumentCategoryLabels,
  instrumentTypeLabels,
} from '@/features/finance/instruments/types';

export function InstrumentDetailHeader({ inst }: { inst: FinancialInstrumentView }) {
  const statusCfg = instrumentStatusConfig[inst.status as keyof typeof instrumentStatusConfig];
  const categoryLabel = instrumentCategoryLabels[inst.category as keyof typeof instrumentCategoryLabels] ?? inst.category;
  const typeLabel = instrumentTypeLabels[inst.type as keyof typeof instrumentTypeLabels] ?? inst.type;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{inst.name}</h2>
          {statusCfg && (
            <Badge className={statusCfg.color}>
              {statusCfg.label}
            </Badge>
          )}
          <Badge variant="secondary">{categoryLabel}</Badge>
          <Badge variant="outline">{typeLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{inst.description} · {inst.issuer}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <KPI label="Carrying Amount" value={`${inst.carryingAmount.toLocaleString()} ${inst.currency}`} />
        <KPI label="Fair Value" value={`${inst.fairValue.toLocaleString()} ${inst.currency}`} />
        <KPI
          label="Unrealized G/L"
          value={`${inst.unrealizedGainLoss >= 0 ? '+' : ''}${inst.unrealizedGainLoss.toLocaleString()} ${inst.currency}`}
          className={inst.unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive'}
        />
      </div>
    </div>
  );
}

export function InstrumentOverview({ inst }: { inst: FinancialInstrumentView }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Face Value" value={`${inst.faceValue.toLocaleString()} ${inst.currency}`} />
        <Field label="Acquisition Cost" value={`${inst.acquisitionCost.toLocaleString()} ${inst.currency}`} />
        <Field label="Acquisition Date" value={inst.acquisitionDate} />
        <Field label="Maturity" value={inst.maturityDate ?? 'No maturity'} />
      </div>
      <div className="space-y-4">
        <Field label="Interest Rate" value={inst.interestRate != null ? `${inst.interestRate}%` : '—'} />
        <Field label="Accrued Interest" value={`${inst.accruedInterest.toLocaleString()} ${inst.currency}`} />
        <Field label="ECL" value={`${inst.ecl.toLocaleString()} ${inst.currency} (Stage ${inst.eclStage})`} />
        <Field label="GL Account" value={inst.glAccountCode} mono />
      </div>
    </div>
  );
}

export function FairValueHistory({ valuations }: { valuations: FairValueView[] }) {
  if (valuations.length === 0)
    return <p className="text-sm text-muted-foreground">No fair value measurements recorded.</p>;

  return (
    <div className="space-y-3">
      {valuations.map((v) => (
        <div key={v.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div>
            <p className="font-medium">{v.valuationMethod}</p>
            <p className="text-xs text-muted-foreground">Level: {v.fairValueLevel}</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold">{v.fairValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{v.measurementDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function KPI({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-semibold', className)}>{value}</p>
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
