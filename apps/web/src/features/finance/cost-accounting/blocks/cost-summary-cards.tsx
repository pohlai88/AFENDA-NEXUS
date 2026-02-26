'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import {
  Building2,
  Gauge,
  GitBranch,
  Calculator,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { CostAccountingSummary } from '../types';

interface CostSummaryCardsProps {
  summary: CostAccountingSummary;
}

export function CostSummaryCards({ summary }: CostSummaryCardsProps) {
  const cards = [
    {
      title: 'Cost Centers',
      value: summary.totalCostCenters.toString(),
      icon: Building2,
      description: `${summary.activeCostCenters} active`,
      color: 'text-blue-500',
    },
    {
      title: 'Cost Drivers',
      value: summary.totalDrivers.toString(),
      icon: Gauge,
      description: 'Allocation bases',
      color: 'text-purple-500',
    },
    {
      title: 'Allocation Rules',
      value: summary.totalRules.toString(),
      icon: GitBranch,
      description: 'Defined rules',
      color: 'text-emerald-500',
    },
    {
      title: 'Allocated YTD',
      value: formatCurrency(summary.totalAllocatedYTD, 'USD'),
      icon: Calculator,
      description: `Last run: ${summary.lastAllocationRun || 'Never'}`,
      color: 'text-amber-500',
    },
    {
      title: 'Budget Variance',
      value: `${Math.abs(summary.budgetVariancePercent).toFixed(1)}%`,
      icon: summary.budgetVariancePercent >= 0 ? TrendingUp : TrendingDown,
      description: summary.budgetVariancePercent >= 0 ? 'Under budget' : 'Over budget',
      color: summary.budgetVariancePercent >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      title: 'Pending',
      value: summary.pendingAllocations.toString(),
      icon: Clock,
      description: 'Allocations to run',
      color: summary.pendingAllocations > 0 ? 'text-amber-500' : 'text-gray-400',
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

      {summary.pendingAllocations > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pending Allocations</AlertTitle>
          <AlertDescription>
            You have{' '}
            <span className="font-medium">{summary.pendingAllocations} allocation run(s)</span>{' '}
            waiting to be executed.{' '}
            <Link href="/finance/cost-centers/allocations" className="underline">
              View allocations
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface CompactCostSummaryProps {
  summary: CostAccountingSummary;
}

export function CompactCostSummary({ summary }: CompactCostSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Cost Accounting Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Cost Centers</span>
            <Badge variant="secondary">{summary.activeCostCenters}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cost Drivers</span>
            <Badge variant="secondary">{summary.totalDrivers}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Allocation Rules</span>
            <Badge variant="secondary">{summary.totalRules}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Allocated YTD</span>
            <span className="font-mono text-sm">
              {formatCurrency(summary.totalAllocatedYTD, 'USD')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Budget Variance</span>
            <span
              className={cn('font-mono text-sm',
                summary.budgetVariancePercent >= 0 ? 'text-variance-positive' : 'text-variance-negative'
              )}
            >
              {summary.budgetVariancePercent >= 0 ? '+' : ''}
              {summary.budgetVariancePercent.toFixed(1)}%
            </span>
          </div>
          {summary.pendingAllocations > 0 && (
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Pending Runs
              </span>
              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                {summary.pendingAllocations}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
