'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CheckCircle, XCircle, Timer, Inbox } from 'lucide-react';
import type { ApprovalStats } from '../types';

interface ApprovalStatsCardsProps {
  stats: ApprovalStats;
}

export function ApprovalStatsCards({ stats }: ApprovalStatsCardsProps) {
  const statItems = [
    {
      title: 'Pending',
      value: stats.pending,
      icon: Inbox,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-info/10 dark:bg-blue-950',
    },
    {
      title: 'Due Today',
      value: stats.dueToday,
      icon: Clock,
      color: 'text-warning dark:text-warning',
      bgColor: 'bg-warning/10 dark:bg-warning/20',
    },
    {
      title: 'At Risk',
      value: stats.atRisk,
      icon: Timer,
      color: 'text-warning dark:text-warning',
      bgColor: 'bg-warning/10 dark:bg-warning/20',
    },
    {
      title: 'SLA Breached',
      value: stats.breached,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10 dark:bg-destructive/20',
    },
    {
      title: 'Approved (7d)',
      value: stats.approvedThisWeek,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10 dark:bg-success/20',
    },
    {
      title: 'Rejected (7d)',
      value: stats.rejectedThisWeek,
      icon: XCircle,
      color: 'text-muted-foreground dark:text-muted-foreground',
      bgColor: 'bg-muted/50 dark:bg-muted',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item) => (
        <Card key={item.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <div className={cn('rounded-full p-2', item.bgColor)}>
              <item.icon className={cn('h-4 w-4', item.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
