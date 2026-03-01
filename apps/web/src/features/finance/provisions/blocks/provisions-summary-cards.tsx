'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface ProvisionsSummaryData {
  activeProvisions: number;
  totalProvisions: number;
  totalBalance: number;
  utilizationYTD: number;
  additionsYTD: number;
}

interface ProvisionsSummaryCardsProps {
  summary: ProvisionsSummaryData;
}

export function ProvisionsSummaryCards({ summary: s }: ProvisionsSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Active Provisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.activeProvisions}</div>
          <p className="text-xs text-muted-foreground">of {s.totalProvisions} total</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(s.totalBalance, 'USD')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Utilization YTD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(s.utilizationYTD, 'USD')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Additions YTD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">
            {formatCurrency(s.additionsYTD, 'USD')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
