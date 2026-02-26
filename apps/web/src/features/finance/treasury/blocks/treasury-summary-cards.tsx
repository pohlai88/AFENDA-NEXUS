'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  FileCheck,
  AlertTriangle,
  Clock,
  Building2,
  Wallet,
} from 'lucide-react';
import type { TreasurySummary } from '../types';

interface TreasurySummaryCardsProps {
  summary: TreasurySummary;
}

export function TreasurySummaryCards({ summary }: TreasurySummaryCardsProps) {
  const cashTrend = summary.forecastedEndOfMonth >= summary.totalCashPosition;

  const cards = [
    {
      title: 'Cash Position',
      value: formatCurrency(summary.totalCashPosition, 'USD'),
      icon: Wallet,
      description: 'Current balance',
      color: 'text-emerald-500',
    },
    {
      title: 'EOM Forecast',
      value: formatCurrency(summary.forecastedEndOfMonth, 'USD'),
      icon: cashTrend ? TrendingUp : TrendingDown,
      description: cashTrend ? 'Projected increase' : 'Projected decrease',
      color: cashTrend ? 'text-green-500' : 'text-amber-500',
    },
    {
      title: 'Active Loans',
      value: summary.activeLoans.toString(),
      icon: Landmark,
      description: formatCurrency(summary.totalLoanBalance, 'USD'),
      color: 'text-blue-500',
    },
    {
      title: 'IC Net Position',
      value: formatCurrency(summary.netIntercompanyPosition, 'USD'),
      icon: Building2,
      description: summary.netIntercompanyPosition >= 0 ? 'Net lender' : 'Net borrower',
      color: summary.netIntercompanyPosition >= 0 ? 'text-blue-500' : 'text-orange-500',
    },
    {
      title: 'Covenants',
      value: summary.covenantsAtRisk + summary.covenantsBreeched > 0
        ? `${summary.covenantsAtRisk + summary.covenantsBreeched} Issues`
        : 'All Clear',
      icon: FileCheck,
      description: summary.covenantsBreeched > 0
        ? `${summary.covenantsBreeched} breached`
        : summary.covenantsAtRisk > 0
          ? `${summary.covenantsAtRisk} at risk`
          : 'Fully compliant',
      color: summary.covenantsBreeched > 0
        ? 'text-destructive'
        : summary.covenantsAtRisk > 0
          ? 'text-amber-500'
          : 'text-green-500',
    },
    {
      title: 'Maturities',
      value: summary.upcomingMaturities.toString(),
      icon: Clock,
      description: 'Next 90 days',
      color: summary.upcomingMaturities > 0 ? 'text-amber-500' : 'text-gray-400',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(summary.covenantsAtRisk > 0 || summary.covenantsBreeched > 0) && (
        <Alert variant={summary.covenantsBreeched > 0 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {summary.covenantsBreeched > 0 ? 'Covenant Breach Alert' : 'Covenant Warning'}
          </AlertTitle>
          <AlertDescription>
            {summary.covenantsBreeched > 0 ? (
              <>
                <span className="font-medium">{summary.covenantsBreeched} covenant(s)</span> are
                currently in breach.
              </>
            ) : (
              <>
                <span className="font-medium">{summary.covenantsAtRisk} covenant(s)</span> are
                approaching threshold limits.
              </>
            )}{' '}
            <Link href="/finance/treasury/covenants" className="underline">
              Review covenants
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
