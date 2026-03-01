'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface TransferPricingSummaryData {
  activePolicies: number;
  totalPolicies: number;
  transactionsYTD: number;
  adjustmentsYTD: number;
  complianceRate: number;
}

interface TransferPricingSummaryCardsProps {
  summary: TransferPricingSummaryData;
}

export function TransferPricingSummaryCards({ summary: s }: TransferPricingSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Active Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.activePolicies}</div>
          <p className="text-xs text-muted-foreground">of {s.totalPolicies} total</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">IC Transactions YTD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.transactionsYTD}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Adjustments YTD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(s.adjustmentsYTD / 1000).toFixed(0)}K</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">Compliance Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{s.complianceRate}%</div>
          <Progress value={s.complianceRate} className="mt-2 h-2" />
        </CardContent>
      </Card>
    </div>
  );
}
