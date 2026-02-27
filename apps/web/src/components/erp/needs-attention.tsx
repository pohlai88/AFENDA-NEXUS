'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AttentionItem, AttentionSeverity, AttentionSummary } from '@/lib/attention/attention.types';

// ─── Severity icon map ───────────────────────────────────────────────────────

const SEVERITY_ICON: Record<
  AttentionSeverity,
  React.ComponentType<{ className?: string }>
> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLOR: Record<AttentionSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

// ─── NeedsAttention ──────────────────────────────────────────────────────────

interface NeedsAttentionProps {
  summary: AttentionSummary;
}

/**
 * "Needs Attention" panel rendered inside the status cluster popover's
 * "Attention" tab. Each item is expandable to show evidence details.
 */
export function NeedsAttention({ summary }: NeedsAttentionProps) {
  if (summary.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium">Everything looks good</p>
        <p className="text-xs text-muted-foreground">No items require your attention</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {summary.items.map((item) => (
        <AttentionItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}
NeedsAttention.displayName = 'NeedsAttention';

// ─── Individual Item Row ─────────────────────────────────────────────────────

function AttentionItemRow({ item }: { item: AttentionItem }) {
  const [expanded, setExpanded] = React.useState(false);
  const Icon = SEVERITY_ICON[item.severity];
  const color = SEVERITY_COLOR[item.severity];

  const timeSince = React.useMemo(() => {
    // Defend against JSON roundtrip: lastComputedAt may arrive as a
    // string (e.g. from REST endpoint) rather than a Date instance.
    const ts = item.lastComputedAt instanceof Date
      ? item.lastComputedAt.getTime()
      : new Date(item.lastComputedAt as unknown as string).getTime();
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [item.lastComputedAt]);

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-start gap-2">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', color)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{item.title}</span>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {item.count}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <ChevronDown className="mr-1 h-3 w-3" />
              ) : (
                <ChevronRight className="mr-1 h-3 w-3" />
              )}
              Details
            </Button>
            <Link
              href={item.href}
              className="text-xs text-primary hover:underline"
            >
              View →
            </Link>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {timeSince}
            </span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="mt-2 rounded bg-muted/50 p-2 text-xs">
          <pre className="overflow-x-auto whitespace-pre-wrap text-muted-foreground">
            {typeof item.evidence === 'string'
              ? item.evidence
              : JSON.stringify(item.evidence, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
