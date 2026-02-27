'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Bell } from 'lucide-react';
import { NeedsAttention } from './needs-attention';
import { NotificationBadge, NotificationCenter } from './notification-center';
import type { AttentionSummary } from '@/lib/attention/attention.types';

// ─── StatusCluster ───────────────────────────────────────────────────────────

interface StatusClusterProps {
  /** Pre-resolved attention summary from the server. */
  attentionSummary?: AttentionSummary;
  /** Initial unread notification count (from server). */
  initialUnreadCount?: number;
}

/**
 * Combined status cluster for the shell header.
 *
 * Shows:
 * 1. Attention badge (popover with expandable items)
 * 2. Notification bell (slide-out sheet)
 *
 * Both badges show counts and use color-coding for severity.
 */
export function StatusCluster({
  attentionSummary,
  initialUnreadCount = 0,
}: StatusClusterProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const handleNotifOpen = useCallback(() => {
    setNotifOpen(true);
  }, []);

  const totalAttention = attentionSummary?.total ?? 0;
  const hasCriticalAttention = (attentionSummary?.critical ?? 0) > 0;

  return (
    <>
      <div className="flex items-center gap-0.5">
        {/* Attention Popover */}
        {attentionSummary && totalAttention > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                aria-label={`${totalAttention} items need attention`}
              >
                <AlertTriangle
                  className={`h-4 w-4 ${
                    hasCriticalAttention ? 'text-destructive' : 'text-amber-500'
                  }`}
                />
                <span
                  className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                    hasCriticalAttention ? 'bg-destructive' : 'bg-amber-500'
                  }`}
                >
                  {totalAttention > 99 ? '99+' : totalAttention}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Needs Attention</h3>
                  <div className="flex gap-1.5">
                    {(attentionSummary.critical > 0) && (
                      <Badge variant="destructive" className="text-[10px]">
                        {attentionSummary.critical} critical
                      </Badge>
                    )}
                    {(attentionSummary.warning > 0) && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        {attentionSummary.warning} warning
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <ScrollArea className="max-h-80">
                <div className="p-3">
                  <NeedsAttention summary={attentionSummary} />
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}

        {/* Notification Bell */}
        <NotificationBadge unreadCount={unreadCount} onClick={handleNotifOpen} />
      </div>

      {/* Notification Center Sheet */}
      <NotificationCenter open={notifOpen} onOpenChange={setNotifOpen} />
    </>
  );
}
StatusCluster.displayName = 'StatusCluster';
