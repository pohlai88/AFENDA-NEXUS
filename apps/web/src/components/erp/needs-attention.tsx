'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/erp/empty-state';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format';
import {
  ATTENTION_SEVERITY_ICON,
  ATTENTION_SEVERITY_COLOR,
} from '@/lib/ui/severity-styles';
import type { AttentionItem, AttentionSummary } from '@/lib/attention/attention.types';

// ─── NeedsAttention ──────────────────────────────────────────────────────────

interface NeedsAttentionProps {
  summary: AttentionSummary;
}

/**
 * "Needs Attention" panel rendered inside the status cluster popover.
 * Each item is expandable to show evidence details.
 * Uses EmptyState when no items (no hardcoded strings).
 */
export function NeedsAttention({ summary }: NeedsAttentionProps) {
  if (summary.items.length === 0) {
    return (
      <EmptyState
        contentKey="shell.attention"
        variant="firstRun"
        size="sm"
        icon={CheckCircle2}
        animate={false}
      />
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
  const Icon = ATTENTION_SEVERITY_ICON[item.severity];
  const color = ATTENTION_SEVERITY_COLOR[item.severity];

  const relativeTime = React.useMemo(() => {
    return formatRelativeTime(item.lastComputedAt);
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
              {relativeTime}
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
