'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import {
  FileText,
  Wallet,
  TrendingDown,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { LeaseSummary } from '../types';

interface LeaseSummaryCardsProps {
  summary: LeaseSummary;
}

export function LeaseSummaryCards({ summary }: LeaseSummaryCardsProps) {
  const cards = [
    {
      title: 'Active Leases',
      value: summary.activeLeases.toString(),
      icon: FileText,
      description: `of ${summary.totalLeases} total`,
      color: 'text-blue-500',
    },
    {
      title: 'ROU Assets',
      value: formatCurrency(summary.totalROUAssets, 'USD'),
      icon: Wallet,
      description: 'Net carrying amount',
      color: 'text-emerald-500',
    },
    {
      title: 'Total Liability',
      value: formatCurrency(summary.totalLeaseLiability, 'USD'),
      icon: TrendingDown,
      description: 'Lease obligations',
      color: 'text-purple-500',
    },
    {
      title: 'Current Liability',
      value: formatCurrency(summary.currentLiability, 'USD'),
      icon: Clock,
      description: 'Due within 12 months',
      color: 'text-amber-500',
    },
    {
      title: 'Monthly Due',
      value: formatCurrency(summary.monthlyPaymentsDue, 'USD'),
      icon: DollarSign,
      description: 'Total monthly payments',
      color: 'text-cyan-500',
    },
    {
      title: 'Expiring Soon',
      value: summary.leasesExpiringSoon.toString(),
      icon: Calendar,
      description: 'Within 90 days',
      color: summary.leasesExpiringSoon > 0 ? 'text-amber-500' : 'text-gray-400',
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

      {summary.leasesExpiringSoon > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Leases Expiring Soon</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{summary.leasesExpiringSoon} lease(s)</span> will expire
            within the next 90 days. Review extension options or plan for renewal.{' '}
            <Link href="/finance/leases?filter=expiring" className="underline">
              View expiring leases
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {summary.pendingModifications > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Pending Modifications</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{summary.pendingModifications} modification(s)</span>{' '}
            awaiting processing.{' '}
            <Link href="/finance/leases/modifications" className="underline">
              Process modifications
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
