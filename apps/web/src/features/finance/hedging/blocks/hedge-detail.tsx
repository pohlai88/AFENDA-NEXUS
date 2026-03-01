import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  HedgeRelationshipView,
  EffectivenessTestView,
} from '@/features/finance/hedging/queries/hedging.queries';
import {
  hedgeTypeLabels,
  hedgeStatusConfig,
  effectivenessResultConfig,
} from '@/features/finance/hedging/types';

export function HedgeDetailHeader({ hedge }: { hedge: HedgeRelationshipView }) {
  const typeLabel = hedgeTypeLabels[hedge.hedgeType as keyof typeof hedgeTypeLabels] ?? hedge.hedgeType;
  const statusCfg = hedgeStatusConfig[hedge.status as keyof typeof hedgeStatusConfig];
  const effCfg = hedge.effectivenessResult
    ? effectivenessResultConfig[hedge.effectivenessResult as keyof typeof effectivenessResultConfig]
    : null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{hedge.name}</h2>
          {statusCfg && (
            <Badge variant={statusCfg.color === 'green' ? 'default' : statusCfg.color === 'red' ? 'destructive' : 'secondary'}>
              {statusCfg.label}
            </Badge>
          )}
          <Badge variant="outline">{typeLabel}</Badge>
          {effCfg && (
            <Badge variant={effCfg.color === 'green' ? 'default' : effCfg.color === 'red' ? 'destructive' : 'secondary'}>
              {effCfg.label}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{hedge.description} · {hedge.hedgedRisk}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <KPI label="Hedge Ratio" value={String(hedge.hedgeRatio)} />
        <KPI label="Cash Flow Reserve" value={`${hedge.cashFlowReserve.toLocaleString()} ${hedge.currency}`} />
        <KPI label="Ineffectiveness" value={`${hedge.ineffectivenessAmount.toLocaleString()} ${hedge.currency}`} className="text-warning" />
      </div>
    </div>
  );
}

export function HedgeOverview({ hedge }: { hedge: HedgeRelationshipView }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Hedged Item" value={hedge.hedgedItemDescription} sub={hedge.hedgedItemId} />
        <Field label="Hedging Instrument" value={hedge.hedgingInstrumentDescription} sub={hedge.hedgingInstrumentId} />
        <Field label="Designation Date" value={hedge.designationDate} />
      </div>
      <div className="space-y-4">
        <Field label="Termination Date" value={hedge.terminationDate ?? '—'} />
        <Field label="Last Effectiveness Test" value={hedge.lastEffectivenessTest ?? 'Not tested'} />
        <Field label="Currency" value={hedge.currency} />
      </div>
    </div>
  );
}

export function EffectivenessTestsList({ tests }: { tests: EffectivenessTestView[] }) {
  if (tests.length === 0)
    return <p className="text-sm text-muted-foreground">No effectiveness tests recorded.</p>;

  return (
    <div className="space-y-3">
      {tests.map((t) => (
        <div key={t.id} className="grid grid-cols-4 gap-4 rounded-md border p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Test Date</p>
            <p className="font-medium">{t.testDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Method</p>
            <p>{t.method}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ratio</p>
            <p className="font-mono">{(t.effectivenessRatio * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Result</p>
            <Badge variant={t.result === 'effective' ? 'default' : t.result === 'ineffective' ? 'destructive' : 'secondary'}>
              {t.result}
            </Badge>
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

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className="mt-1 text-sm">{value}</p>
      { sub ? <p className="text-xs text-muted-foreground font-mono">{sub}</p> : null}
    </div>
  );
}
