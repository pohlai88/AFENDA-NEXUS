'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/erp/empty-state';
import { cn } from '@/lib/utils';
import {
  FileText,
  Receipt,
  Banknote,
  GitMerge,
  Plus,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import type { QuickAction } from '../types';

// ─── Icon Map ────────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Receipt,
  Banknote,
  GitMerge,
  Plus,
};

// ─── Quick Action Button ─────────────────────────────────────────────────────

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = iconMap[action.icon] ?? Plus;

  return (
    <Button
      variant={action.variant === 'primary' ? 'default' : 'outline'}
      asChild
      className="h-auto flex-col items-start gap-2 p-4 text-left"
    >
      <Link href={action.href}>
        <div className="flex w-full items-center justify-between">
          <div
            className={cn(
              'rounded-md p-2',
              action.variant === 'primary' ? 'bg-primary-foreground/10' : 'bg-accent'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <ArrowRight className="h-4 w-4 opacity-50" />
        </div>
        <div className="space-y-0.5">
          <div className="font-medium text-sm">{action.title}</div>
          <div className="text-xs text-muted-foreground">{action.description}</div>
        </div>
      </Link>
    </Button>
  );
}

// ─── Quick Actions Panel ─────────────────────────────────────────────────────

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section aria-labelledby="finance-quick-actions-title">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle id="finance-quick-actions-title" className="text-base">
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {actions.length === 0 ? (
            <EmptyState
              contentKey="finance.dashboard.quickActions"
              variant="firstRun"
              constraint="2x1"
            />
          ) : (
            actions.map((action) => <QuickActionButton key={action.id} action={action} />)
          )}
        </CardContent>
      </Card>
    </section>
  );
}
