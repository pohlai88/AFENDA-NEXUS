import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Network, Building2, Globe, Users } from 'lucide-react';
import { getGroupEntities, getGoodwillAllocations, getConsolidationSummary } from '@/features/finance/consolidation/queries/consolidation.queries';
import { formatCurrency } from '@/lib/utils';
import { entityTypeLabels, entityStatusConfig, consolidationMethodLabels } from '@/features/finance/consolidation/types';
import type { GroupEntity } from '@/features/finance/consolidation/types';

async function SummarySection() {
  const result = await getConsolidationSummary();
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  const s = result.data;
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Entities</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.totalEntities}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Subsidiaries</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.subsidiaries}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Associates/JVs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{s.associates + s.jointVentures}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Goodwill</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(s.totalGoodwill, 'USD')}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">NCI Equity</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(s.nciEquity, 'USD')}</div></CardContent></Card>
    </div>
  );
}

function EntityNode({ entity, level = 0 }: { entity: GroupEntity; level?: number }) {
  const config = entityStatusConfig[entity.status];
  return (
    <div style={{ marginLeft: level * 24 }}>
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent cursor-pointer">
        <div className="bg-primary/10 rounded p-2"><Building2 className="h-4 w-4 text-primary" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{entity.entityCode}</span>
            <span className="font-medium">{entity.name}</span>
            {entity.entityType !== 'parent' && <Badge variant="secondary">{entityTypeLabels[entity.entityType]}</Badge>}
            <Badge className={config.color}>{config.label}</Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{entity.country}</span>
            <span>{entity.currency}</span>
            {entity.ownershipPercent < 100 && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{entity.ownershipPercent}% owned</span>}
            <span>{consolidationMethodLabels[entity.consolidationMethod]}</span>
          </div>
        </div>
      </div>
      {entity.children?.map((child) => <EntityNode key={child.id} entity={child} level={level + 1} />)}
    </div>
  );
}

async function EntitiesTreeSection() {
  const result = await getGroupEntities();
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />Group Structure</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {result.data.map((entity) => <EntityNode key={entity.id} entity={entity} />)}
      </CardContent>
    </Card>
  );
}

export default function ConsolidationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Network className="h-8 w-8" />Consolidation</h1>
          <p className="text-muted-foreground">Group entities, ownership structure, and goodwill</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/finance/consolidation/run">Run Consolidation</Link></Button>
          <Button asChild><Link href="/finance/consolidation/entities/new"><Plus className="mr-2 h-4 w-4" />Add Entity</Link></Button>
        </div>
      </div>
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[100px]" />)}</div>}><SummarySection /></Suspense>
      <Suspense fallback={<Skeleton className="h-[400px]" />}><EntitiesTreeSection /></Suspense>
    </div>
  );
}
