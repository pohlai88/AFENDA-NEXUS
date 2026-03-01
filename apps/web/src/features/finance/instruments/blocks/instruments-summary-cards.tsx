'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';

interface InstrumentsSummaryData {
  totalInstruments: number;
  totalCarryingAmount: number;
  totalFairValue: number;
  unrealizedGainLoss: number;
}

interface InstrumentsSummaryCardsProps {
  summary: InstrumentsSummaryData;
}

export function InstrumentsSummaryCards({ summary: s }: InstrumentsSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Instruments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.totalInstruments}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Carrying Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(s.totalCarryingAmount, 'USD')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Fair Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(s.totalFairValue, 'USD')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Unrealized G/L</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn('text-2xl font-bold', s.unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive')}
          >
            {formatCurrency(s.unrealizedGainLoss, 'USD')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
