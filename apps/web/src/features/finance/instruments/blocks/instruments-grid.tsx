'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  instrumentStatusConfig,
  instrumentCategoryLabels,
  instrumentTypeLabels,
  fairValueLevelLabels,
} from '../types';
import type { InstrumentStatus, InstrumentType, InstrumentCategory, FairValueLevel } from '../types';
import type { InstrumentView as FinancialInstrument } from '../queries/instruments.queries';
import { routes } from '@/lib/constants';

interface InstrumentsGridProps {
  instruments: FinancialInstrument[];
}

function InstrumentCard({ instrument }: { instrument: FinancialInstrument }) {
  const config = instrumentStatusConfig[instrument.status as InstrumentStatus];
  const gainLossColor = instrument.unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive';
  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-sm text-muted-foreground">
              {instrument.instrumentNumber}
            </div>
            <div className="font-medium">{instrument.name}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{instrumentTypeLabels[instrument.type as InstrumentType]}</Badge>
              <Badge variant="outline">{instrumentCategoryLabels[instrument.category as InstrumentCategory]}</Badge>
            </div>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Fair Value</span>
            <div className="font-mono font-medium">
              {formatCurrency(instrument.fairValue, instrument.currency)}
            </div>
            <div className="text-xs text-muted-foreground">
              {fairValueLevelLabels[instrument.fairValueLevel as FairValueLevel]}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Unrealized G/L</span>
            <div className={cn('font-mono', gainLossColor)}>
              {formatCurrency(instrument.unrealizedGainLoss, instrument.currency)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Last Valued</span>
            <div>{formatDate(instrument.lastValuationDate)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InstrumentsGrid({ instruments }: InstrumentsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {instruments.map((i) => (
        <Link key={i.id} href={routes.finance.instrumentDetail(i.id)}>
          <InstrumentCard instrument={i} />
        </Link>
      ))}
    </div>
  );
}
