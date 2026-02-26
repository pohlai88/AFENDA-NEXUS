'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { routes } from '@/lib/constants';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Receipt,
  Clock,
  AlertTriangle,
  Calculator,
} from 'lucide-react';
import type { ProjectSummary } from '../types';

interface ProjectSummaryCardsProps {
  summary: ProjectSummary;
}

export function ProjectSummaryCards({ summary }: ProjectSummaryCardsProps) {
  const cards = [
    {
      title: 'Total Projects',
      value: summary.totalProjects.toString(),
      icon: Briefcase,
      description: `${summary.activeProjects} active`,
      color: 'text-blue-500',
    },
    {
      title: 'Contract Value',
      value: formatCurrency(summary.totalContractValue, 'USD'),
      icon: DollarSign,
      description: `Budget: ${formatCurrency(summary.totalBudgetedCost, 'USD')}`,
      color: 'text-emerald-500',
    },
    {
      title: 'Billed Amount',
      value: formatCurrency(summary.totalBilledAmount, 'USD'),
      icon: Receipt,
      description: `${formatCurrency(summary.totalUnbilledAmount, 'USD')} unbilled`,
      color: 'text-accent-foreground',
    },
    {
      title: 'WIP Balance',
      value: formatCurrency(summary.totalWIP, 'USD'),
      icon: Calculator,
      description: 'Revenue not yet billed',
      color: 'text-warning',
    },
    {
      title: 'Average Margin',
      value: `${summary.averageMargin.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Across all projects',
      color: summary.averageMargin >= 25 ? 'text-success' : 'text-warning',
    },
    {
      title: 'Actual Cost',
      value: formatCurrency(summary.totalActualCost, 'USD'),
      icon: Clock,
      description: `vs budget: ${formatCurrency(summary.totalBudgetedCost, 'USD')}`,
      color:
        summary.totalActualCost > summary.totalBudgetedCost ? 'text-destructive' : 'text-success',
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

      {summary.projectsOverBudget > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget Alert</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{summary.projectsOverBudget} projects</span> are over
            budget.{''}
            <Link href={`${routes.finance.projects}?filter=over_budget`} className="underline">
              View projects
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface CompactProjectSummaryProps {
  summary: ProjectSummary;
}

export function CompactProjectSummary({ summary }: CompactProjectSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Projects Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Projects</span>
            <Badge variant="secondary">{summary.activeProjects}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Contract</span>
            <span className="font-mono text-sm">
              {formatCurrency(summary.totalContractValue, 'USD')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Billed</span>
            <span className="font-mono text-sm">
              {formatCurrency(summary.totalBilledAmount, 'USD')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">WIP</span>
            <span className="font-mono text-sm text-warning">
              {formatCurrency(summary.totalWIP, 'USD')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg. Margin</span>
            <span
              className={cn(
                'font-mono text-sm',
                summary.averageMargin >= 25 ? 'text-success' : 'text-warning'
              )}
            >
              {summary.averageMargin.toFixed(1)}%
            </span>
          </div>
          {summary.projectsOverBudget > 0 && (
            <div className="flex items-center justify-between text-destructive">
              <span className="text-sm flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Over Budget
              </span>
              <Badge variant="destructive">{summary.projectsOverBudget}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
