'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ACTION_BTN,
  BADGE_WARNING,
  ICON,
  NOTIFICATION_COUNTER,
  POPOVER_ATTENTION_W,
  SCROLL_MAX_H,
} from './shell.tokens';
import { ATTENTION_LABELS } from '@/lib/shell/attention-config.registry';
import { EmptyState } from '@/components/erp/empty-state';
import { NeedsAttention } from '@/components/erp/needs-attention';
import { NotificationPopover } from '@/components/erp/notification-center';
import type { AttentionSummary } from '@/lib/attention/attention.types';

// ─── AfendaStatusCluster ─────────────────────────────────────────────────────

interface AfendaStatusClusterProps {
  /** Pre-resolved attention summary from the server. */
  attentionSummary?: AttentionSummary;
  /** Initial unread notification count (from server). */
  initialUnreadCount?: number;
}

/**
 * Combined status cluster for the shell header.
 *
 * Always shows:
 * 1. Attention popover (icon: AlertTriangle) — empty state when no items
 * 2. Notification popover (bell) — empty state when no notifications
 */
export function AfendaStatusCluster({
  attentionSummary,
  initialUnreadCount = 0,
}: AfendaStatusClusterProps) {
  const totalAttention = attentionSummary?.total ?? 0;
  const hasCriticalAttention = (attentionSummary?.critical ?? 0) > 0;
  const hasAttention = totalAttention > 0;

  return (
    <>
      <div className="flex items-center gap-0.5">
        {/* Attention Popover — always visible, EmptyState when no items */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn('relative', ACTION_BTN)}
                  aria-label={
                    hasAttention ? ATTENTION_LABELS.items(totalAttention) : ATTENTION_LABELS.none
                  }
                >
                  <AlertTriangle
                    className={cn(ICON, hasCriticalAttention ? 'text-destructive' : 'text-warning')}
                    aria-hidden
                  />
                  {hasAttention && (
                    <Badge
                      variant={hasCriticalAttention ? 'destructive' : 'secondary'}
                      className={cn(
                        NOTIFICATION_COUNTER,
                        !hasCriticalAttention && 'bg-warning text-warning-foreground'
                      )}
                    >
                      {totalAttention > 99 ? '99+' : totalAttention}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {hasAttention ? ATTENTION_LABELS.tooltip(totalAttention) : ATTENTION_LABELS.title}
            </TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className={cn(POPOVER_ATTENTION_W, 'p-0')}>
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{ATTENTION_LABELS.title}</h3>
                {hasAttention && attentionSummary && (
                  <div className="flex gap-1.5">
                    {(attentionSummary.critical ?? 0) > 0 && (
                      <Badge variant="destructive">
                        {attentionSummary.critical} {ATTENTION_LABELS.critical}
                      </Badge>
                    )}
                    {(attentionSummary.warning ?? 0) > 0 && (
                      <Badge variant="outline" className={BADGE_WARNING}>
                        {attentionSummary.warning} {ATTENTION_LABELS.warning}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <ScrollArea className={SCROLL_MAX_H}>
              <div className="p-3">
                {hasAttention && attentionSummary ? (
                  <NeedsAttention summary={attentionSummary} />
                ) : (
                  <EmptyState
                    contentKey="shell.attention"
                    variant="firstRun"
                    constraint="1x2"
                    icon={CheckCircle2}
                  />
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Notification Popover */}
        <NotificationPopover initialUnreadCount={initialUnreadCount} />
      </div>
    </>
  );
}
AfendaStatusCluster.displayName = 'AfendaStatusCluster';
