'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface DeferredTaxSummaryData {
  totalDTA: number;
  totalDTL: number;
  netPosition: number;
  valuationAllowance: number;
}

interface DeferredTaxSummaryCardsProps {
  summary: DeferredTaxSummaryData;
}

export function DeferredTaxSummaryCards({ summary: s }: DeferredTaxSummaryCardsProps) {
  const isNetAsset = s.netPosition >= 0;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Total DTA</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(s.totalDTA, 'USD')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Total DTL</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(s.totalDTL, 'USD')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Net Position</CardTitle>
          <Scale className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={cn('text-2xl font-bold', isNetAsset ? 'text-success' : 'text-destructive')}>
            {formatCurrency(Math.abs(s.netPosition), 'USD')}
          </div>
          <p className="text-xs text-muted-foreground">
            {isNetAsset ? 'Net Deferred Tax Asset' : 'Net Deferred Tax Liability'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Valuation Allowance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">
            {formatCurrency(s.valuationAllowance, 'USD')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
