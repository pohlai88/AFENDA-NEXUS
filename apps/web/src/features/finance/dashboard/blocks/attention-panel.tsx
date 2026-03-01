'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/erp/empty-state';
import { cn, formatRelativeTime } from '@/lib/utils';
import { toSorted } from '@/lib/utils/array';
import { AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import type { AttentionItem, AttentionPriority } from '../types';

// ─── Priority Config ─────────────────────────────────────────────────────────

const priorityConfig: Record<
  AttentionPriority,
  {
    icon: typeof AlertCircle;
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
    bgColor: string;
    iconColor: string;
  }
> = {
  critical: {
    icon: AlertCircle,
    badgeVariant: 'destructive',
    bgColor: 'bg-destructive/10 dark:bg-destructive/20',
    iconColor: 'text-destructive',
  },
  high: {
    icon: AlertTriangle,
    badgeVariant: 'destructive',
    bgColor: 'bg-warning/10 dark:bg-warning/20',
    iconColor: 'text-warning',
  },
  medium: {
    icon: AlertTriangle,
    badgeVariant: 'outline',
    bgColor: 'bg-warning/10 dark:bg-warning/20',
    iconColor: 'text-warning',
  },
  low: {
    icon: Info,
    badgeVariant: 'secondary',
    bgColor: 'bg-info/10 dark:bg-info/20',
    iconColor: 'text-info',
  },
};

// ─── Attention Item Row ──────────────────────────────────────────────────────

function AttentionItemRow({ item }: { item: AttentionItem }) {
  const config = priorityConfig[item.priority];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-colors hover:opacity-90',
        config.bgColor
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5', config.iconColor)} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm">{item.title}</span>
          <Badge variant={config.badgeVariant} className="shrink-0 text-xs">
            {item.priority}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        {item.dueDate && (
          <p className="text-xs text-muted-foreground">Due: {formatRelativeTime(item.dueDate)}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" asChild className="shrink-0">
        <Link href={item.href}>
          {item.actionLabel || 'View'}
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

// ─── Attention Panel Component ───────────────────────────────────────────────

interface AttentionPanelProps {
  items: AttentionItem[];
}

export function AttentionPanel({ items }: AttentionPanelProps) {
  // Sort by priority (RBP-03: browser-compatible immutability)
  const sortedItems = toSorted(items, (a, b) => {
    const priorityOrder: Record<AttentionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const criticalCount = items.filter(
    (i) => i.priority === 'critical' || i.priority === 'high'
  ).length;

  return (
    <section aria-labelledby="finance-attention-title">
      <Card className={criticalCount > 0 ? 'border-destructive/50' : undefined}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle id="finance-attention-title" className="text-base">
                Needs Attention
              </CardTitle>
              <CardDescription>Items requiring your action</CardDescription>
            </div>
            {criticalCount > 0 && <Badge variant="destructive">{criticalCount} urgent</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedItems.map((item) => (
            <AttentionItemRow key={item.id} item={item} />
          ))}
          {items.length === 0 && (
            <EmptyState
              variant="firstRun"
              size="sm"
              title="All caught up!"
              description="No items need attention."
              icon={Info}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
