'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime } from '@/lib/utils';
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
    bgColor: 'bg-red-50 dark:bg-red-950',
    iconColor: 'text-red-500',
  },
  high: {
    icon: AlertTriangle,
    badgeVariant: 'destructive',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    iconColor: 'text-orange-500',
  },
  medium: {
    icon: AlertTriangle,
    badgeVariant: 'outline',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-500',
  },
  low: {
    icon: Info,
    badgeVariant: 'secondary',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-500',
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
          <p className="text-xs text-muted-foreground">
            Due: {formatRelativeTime(item.dueDate)}
          </p>
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
  // Sort by priority
  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const criticalCount = items.filter((i) => i.priority === 'critical' || i.priority === 'high').length;

  return (
    <Card className={criticalCount > 0 ? 'border-destructive/50' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Needs Attention</CardTitle>
            <CardDescription>Items requiring your action</CardDescription>
          </div>
          {criticalCount > 0 && (
            <Badge variant="destructive">{criticalCount} urgent</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedItems.map((item) => (
          <AttentionItemRow key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">All caught up! No items need attention.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
