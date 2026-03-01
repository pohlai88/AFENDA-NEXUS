'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface HedgingSummaryData {
  activeRelationships: number;
  totalRelationships?: number;
  cashFlowReserveBalance?: number;
  totalCashFlowReserve?: number;
  totalIneffectiveness: number;
  upcomingTests?: number;
  fairValueHedges?: number;
  cashFlowHedges?: number;
  netInvestmentHedges?: number;
}

interface HedgingSummaryCardsProps {
  summary: HedgingSummaryData;
}

export function HedgingSummaryCards({ summary: s }: HedgingSummaryCardsProps) {
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
            {formatCurrency(s.cashFlowReserveBalance ?? 0, 'USD')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Ineffectiveness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">
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
