'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/erp/empty-state';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import { layoutTokens } from '@/lib/layout-tokens';
import {
  FileText,
  Receipt,
  Banknote,
  GitMerge,
  Calendar,
  BarChart3,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityItem, ActivityType } from '../types';

// ─── Activity Type Config ────────────────────────────────────────────────────

const activityConfig: Record<ActivityType, { icon: LucideIcon; color: string; label: string }> = {
  journal_posted: {
    icon: FileText,
    color: 'text-info bg-info/10 dark:bg-info/20',
    label: 'Journal',
  },
  invoice_created: {
    icon: Receipt,
    color: 'text-success bg-success/10 dark:bg-success/20',
    label: 'Invoice',
  },
  payment_received: {
    icon: Banknote,
    color: 'text-success bg-success/10 dark:bg-success/20',
    label: 'Payment',
  },
  payment_sent: {
    icon: Banknote,
    color: 'text-warning bg-warning/10 dark:bg-warning/20',
    label: 'Payment',
  },
  approval_pending: {
    icon: Clock,
    color: 'text-warning bg-warning/10 dark:bg-warning/20',
    label: 'Approval',
  },
  reconciliation_complete: {
    icon: GitMerge,
    color: 'text-accent-foreground bg-accent/50 dark:bg-accent',
    label: 'Reconciliation',
  },
  period_closed: {
    icon: Calendar,
    color: 'text-info bg-info/10 dark:bg-info/20',
    label: 'Period',
  },
  report_generated: {
    icon: BarChart3,
    color: 'text-info bg-info/10 dark:bg-info/20',
    label: 'Report',
  },
};

// ─── Activity Item Component ─────────────────────────────────────────────────

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const config = activityConfig[item.type];
  const Icon = config.icon;

  const content = (
    <div className="flex items-start gap-3 py-3 px-1 hover:bg-accent/50 rounded-md transition-colors">
      <div className={cn('rounded-full p-2', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{item.title}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(item.timestamp)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        <div className="flex items-center gap-2">
          {item.amount != null && item.currency != null && (
            <Badge variant="secondary" className="text-xs font-mono">
              {formatCurrency(item.amount, item.currency)}
            </Badge>
          )}
          {item.user && <span className="text-xs text-muted-foreground">by {item.user}</span>}
        </div>
      </div>
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }

  return content;
}

// ─── Activity Feed Component ─────────────────────────────────────────────────

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxHeight?: number;
}

export function ActivityFeed({ activities, maxHeight }: ActivityFeedProps) {
  return (
    <section aria-labelledby="finance-activity-title">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle id="finance-activity-title" className="text-base">
            Recent Activity
          </CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="px-6 py-6">
              <EmptyState
                variant="noResults"
                size="sm"
                title="No recent activity"
                description="Transactions and updates will appear here."
              />
            </div>
          ) : (
            <ScrollArea
              className={maxHeight != null ? undefined : layoutTokens.scrollAreaH}
              style={maxHeight != null ? { height: maxHeight } : undefined}
            >
              <div className="px-6 pb-4 divide-y">
                {activities.map((item) => (
                  <ActivityItemRow key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
