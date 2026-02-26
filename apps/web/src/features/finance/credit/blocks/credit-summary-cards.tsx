'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';
import {
  Users,
  CreditCard,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldAlert,
  Ban,
  FileWarning,
} from 'lucide-react';
import type { CreditSummary } from '../types';

interface CreditSummaryCardsProps {
  summary: CreditSummary;
}

export function CreditSummaryCards({ summary }: CreditSummaryCardsProps) {
  const cards = [
    {
      title: 'Customers',
      value: summary.totalCustomers.toString(),
      icon: Users,
      description: `${summary.highRiskCustomers} high risk`,
      color: 'text-blue-500',
    },
    {
      title: 'Total Credit Limit',
      value: formatCurrency(summary.totalCreditLimit, 'USD'),
      icon: CreditCard,
      description: 'Across all customers',
      color: 'text-emerald-500',
    },
    {
      title: 'Outstanding',
      value: formatCurrency(summary.totalOutstanding, 'USD'),
      icon: TrendingUp,
      description: `${summary.avgUtilization.toFixed(1)}% utilization`,
      color: 'text-accent-foreground',
    },
    {
      title: 'Overdue',
      value: formatCurrency(summary.totalOverdue, 'USD'),
      icon: AlertTriangle,
      description: 'Past due balances',
      color: summary.totalOverdue > 0 ? 'text-destructive' : 'text-success',
    },
    {
      title: 'On Hold',
      value: summary.customersOnHold.toString(),
      icon: Ban,
      description: 'Customers blocked',
      color: summary.customersOnHold > 0 ? 'text-warning' : 'text-muted-foreground',
    },
    {
      title: 'Pending Reviews',
      value: summary.pendingReviews.toString(),
      icon: Clock,
      description: `${summary.overdueReviews} overdue`,
      color: summary.pendingReviews > 0 ? 'text-warning' : 'text-muted-foreground',
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

      {summary.highRiskCustomers > 0 && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>High Risk Customers</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{summary.highRiskCustomers} customers</span> are
            classified as high risk.{''}
            <Link href={`${routes.finance.creditLimits}?filter=high_risk`} className="underline">
              Review now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {summary.overdueReviews > 0 && (
        <Alert variant="destructive">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>Overdue Reviews</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{summary.overdueReviews} credit reviews</span> are past
            their due date.{''}
            <Link href={`${routes.finance.creditReviews}?filter=overdue`} className="underline">
              View overdue reviews
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
