import { Badge } from '@/components/ui/badge';
import {
  entityTypeLabels,
  consolidationMethodLabels,
  entityStatusConfig,
} from '@/features/finance/consolidation/types';

interface GroupEntity {
  name: string;
  entityType: string;
  consolidationMethod: string;
  status: string;
  country: string;
  currency: string;
  ownershipPercent: number;
  votingRightsPercent: number;
  fxRate: number;
  functionalCurrency: string;
  reportingCurrency: string;
  acquisitionDate: string | null;
  divestmentDate: string | null;
  parentId: string | null;
}

export function EntityDocumentHeader({ entity }: { entity: GroupEntity }) {
  const typeLabel = entityTypeLabels[entity.entityType as keyof typeof entityTypeLabels] ?? entity.entityType;
  const methodLabel = consolidationMethodLabels[entity.consolidationMethod as keyof typeof consolidationMethodLabels] ?? entity.consolidationMethod;
  const statusCfg = entityStatusConfig[entity.status as keyof typeof entityStatusConfig];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{entity.name}</h2>
          {statusCfg && (
            <Badge variant={statusCfg.color === 'green' ? 'default' : statusCfg.color === 'red' ? 'destructive' : 'secondary'}>{statusCfg.label}</Badge>
          )}
          <Badge variant="outline">{typeLabel}</Badge>
          <Badge variant="secondary">{methodLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{entity.country} · {entity.currency}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div><p className="text-xs text-muted-foreground">Ownership</p><p className="text-sm font-semibold">{entity.ownershipPercent}%</p></div>
        <div><p className="text-xs text-muted-foreground">Voting Rights</p><p className="text-sm font-semibold">{entity.votingRightsPercent}%</p></div>
        <div><p className="text-xs text-muted-foreground">FX Rate</p><p className="text-sm font-semibold">{entity.fxRate}</p></div>
      </div>
    </div>
  );
}

export function EntityOverviewTab({ entity }: { entity: GroupEntity }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <div><h3 className="text-sm font-medium text-muted-foreground">Functional Currency</h3><p className="mt-1 text-sm">{entity.functionalCurrency}</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Reporting Currency</h3><p className="mt-1 text-sm">{entity.reportingCurrency}</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Acquisition Date</h3><p className="mt-1 text-sm">{entity.acquisitionDate ?? '—'}</p></div>
      </div>
      <div className="space-y-4">
        <div><h3 className="text-sm font-medium text-muted-foreground">Divestment Date</h3><p className="mt-1 text-sm">{entity.divestmentDate ?? '—'}</p></div>
        <div><h3 className="text-sm font-medium text-muted-foreground">Parent ID</h3><p className="mt-1 text-sm font-mono">{entity.parentId ?? 'Root'}</p></div>
      </div>
    </div>
  );
}
