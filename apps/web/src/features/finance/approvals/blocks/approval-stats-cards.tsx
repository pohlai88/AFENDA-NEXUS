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
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Due Today',
      value: stats.dueToday,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      title: 'At Risk',
      value: stats.atRisk,
      icon: Timer,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'SLA Breached',
      value: stats.breached,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
    {
      title: 'Approved (7d)',
      value: stats.approvedThisWeek,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Rejected (7d)',
      value: stats.rejectedThisWeek,
      icon: XCircle,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-50 dark:bg-slate-950',
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
