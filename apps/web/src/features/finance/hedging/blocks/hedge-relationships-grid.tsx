'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  hedgeStatusConfig,
  hedgeTypeLabels,
  effectivenessResultConfig,
} from '../types';
import type { HedgeStatus, HedgeType, EffectivenessResult } from '../types';
import type { HedgeRelationshipView as HedgeRelationship } from '../queries/hedging.queries';
import { routes } from '@/lib/constants';

interface HedgeRelationshipsGridProps {
  relationships: HedgeRelationship[];
}

function HedgeCard({ hedge }: { hedge: HedgeRelationship }) {
  const config = hedgeStatusConfig[hedge.status as HedgeStatus];
  const effConfig = hedge.effectivenessResult
    ? effectivenessResultConfig[hedge.effectivenessResult as EffectivenessResult]
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
              {hedgeTypeLabels[hedge.hedgeType as HedgeType]}
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

export function HedgeRelationshipsGrid({ relationships }: HedgeRelationshipsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {relationships.map((h) => (
        <Link key={h.id} href={routes.finance.hedgeDetail(h.id)}>
          <HedgeCard hedge={h} />
        </Link>
      ))}
    </div>
  );
}
