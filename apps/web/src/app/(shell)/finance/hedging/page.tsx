import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  getHedgeRelationships,
  getHedgingSummary,
} from '@/features/finance/hedging/queries/hedging.queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  hedgeStatusConfig,
  hedgeTypeLabels,
  effectivenessResultConfig,
} from '@/features/finance/hedging/types';
import type { HedgeRelationship } from '@/features/finance/hedging/types';
import { routes } from '@/lib/constants';

async function SummarySection() {
  const result = await getHedgingSummary();
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  const s = result.data;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Active Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.activeRelationships}</div>
          <p className="text-xs text-muted-foreground">of {s.totalRelationships} total</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Cash Flow Reserve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(s.cashFlowReserveBalance, 'USD')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Ineffectiveness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(s.totalIneffectiveness, 'USD')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Upcoming Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.upcomingTests}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function HedgeCard({ hedge }: { hedge: HedgeRelationship }) {
  const config = hedgeStatusConfig[hedge.status];
  const effConfig = hedge.effectivenessResult
    ? effectivenessResultConfig[hedge.effectivenessResult]
    : null;
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm text-muted-foreground">
              {hedge.relationshipNumber}
            </div>
            <div className="font-medium">{hedge.name}</div>
            <Badge variant="secondary" className="mt-1">
              {hedgeTypeLabels[hedge.hedgeType]}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={config.color}>{config.label}</Badge>
            {effConfig && <Badge className={effConfig.color}>{effConfig.label}</Badge>}
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Hedged Item:</span>{' '}
            {hedge.hedgedItemDescription}
          </div>
          <div>
            <span className="text-muted-foreground">Hedging Instrument:</span>{' '}
            {hedge.hedgingInstrumentDescription}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Last Test:{' '}
              {hedge.lastEffectivenessTest ? formatDate(hedge.lastEffectivenessTest) : '—'}
            </span>
            {hedge.hedgeType === 'cash_flow' && hedge.cashFlowReserve !== 0 && (
              <span className="font-mono">
                Reserve: {formatCurrency(hedge.cashFlowReserve, hedge.currency)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function HedgesSection() {
  const result = await getHedgeRelationships({ status: 'active' });
  if (!result.ok) return <div className="text-destructive">{result.error}</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {result.data.map((h) => (
        <Link key={h.id} href={routes.finance.hedgeDetail(h.id)}>
          <HedgeCard hedge={h} />
        </Link>
      ))}
    </div>
  );
}

export default function HedgingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Hedge Accounting (IFRS 9)
          </h1>
          <p className="text-muted-foreground">Hedge relationships and effectiveness testing</p>
        </div>
        <Button asChild>
          <Link href={routes.finance.hedgeNew}>
            <Plus className="mr-2 h-4 w-4" />
            Designate Hedge
          </Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        }
      >
        <SummarySection />
      </Suspense>
      <h2 className="text-xl font-semibold">Active Hedge Relationships</h2>
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px]" />
            ))}
          </div>
        }
      >
        <HedgesSection />
      </Suspense>
    </div>
  );
}
