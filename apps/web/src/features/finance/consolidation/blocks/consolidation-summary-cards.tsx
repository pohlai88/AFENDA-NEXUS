'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface ConsolidationSummaryData {
  totalEntities: number;
  subsidiaries: number;
  associates: number;
  jointVentures: number;
  totalGoodwill: number;
  nciEquity: number;
}

interface ConsolidationSummaryCardsProps {
  summary: ConsolidationSummaryData;
}

export function ConsolidationSummaryCards({ summary: s }: ConsolidationSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Entities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.totalEntities}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Subsidiaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.subsidiaries}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Associates/JVs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.associates + s.jointVentures}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Goodwill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(s.totalGoodwill, 'USD')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">NCI Equity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(s.nciEquity, 'USD')}</div>
        </CardContent>
      </Card>
    </div>
  );
}
