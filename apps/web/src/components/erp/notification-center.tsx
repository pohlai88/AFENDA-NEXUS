'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { POPOVER_NOTIFICATION_W, SCROLL_MAX_H } from '@/components/afenda/shell.tokens';
import { Bell, BellOff, Check, CheckCheck, X, Clock } from 'lucide-react';
import {
  NOTIFICATION_SEVERITY_ICON,
  NOTIFICATION_SEVERITY_COLOR,
  NOTIFICATION_SEVERITY_BG,
} from '@/lib/ui/severity-styles';
import { formatRelativeTime } from '@/lib/format';
import {
  getNotificationSummary,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from '@/lib/notifications/notification.actions';
import type { Notification } from '@/lib/notifications/notification.types';
import { CATEGORY_LABELS } from '@/lib/notifications/notification.types';
import { EmptyState } from '@/components/erp/empty-state';

// ─── NotificationPopover ───────────────────────────────────────────────────

interface NotificationPopoverProps {
  /** Initial unread count from server. */
  initialUnreadCount?: number;
  /** Fired whenever the unread count changes (read, dismiss, fetch). */
  onUnreadCountChange?: (count: number) => void;
}

/**
 * Notification popover — bell trigger with dropdown content.
 * Shows all notifications with filtering by read/unread tabs.
 */
export function NotificationPopover({
  initialUnreadCount = 0,
  onUnreadCountChange,
}: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isPending, startTransition] = useTransition();

  const onUnreadCountChangeRef = React.useRef(onUnreadCountChange);
  onUnreadCountChangeRef.current = onUnreadCountChange;
  React.useEffect(() => {
    onUnreadCountChangeRef.current?.(unreadCount);
  }, [unreadCount]);

  const fetchNotifications = useCallback(async () => {
    try {
      const summary = await getNotificationSummary();
      setNotifications(summary.notifications);
      setUnreadCount(summary.unreadCount);
    } catch (err) {
      console.error('[NotificationPopover] Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      await fetchNotifications();
    });
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      startTransition(async () => {
        await fetchNotifications();
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [open, fetchNotifications]);

  const handleMarkRead = useCallback((id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: 'read' as const, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: 'read' as const,
          readAt: n.readAt ?? new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    });
  }, []);

  const handleDismiss = useCallback(
    (id: string) => {
      startTransition(async () => {
        await dismissNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const dismissed = notifications.find((n) => n.id === id);
        if (dismissed?.status === 'unread') {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      });
    },
    [notifications]
  );

  const visibleNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => n.status === 'unread')
      : notifications.filter((n) => n.status !== 'dismissed');

  // Group notifications by date bucket
  const groupedNotifications = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86_400_000;

    const groups: { label: string; items: typeof visibleNotifications }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier', items: [] },
    ];

    for (const n of visibleNotifications) {
      const ts = new Date(n.createdAt).getTime();
      if (ts >= todayStart) groups[0]?.items.push(n);
      else if (ts >= yesterdayStart) groups[1]?.items.push(n);
      else groups[2]?.items.push(n);
    }

    return groups.filter((g) => g.items.length > 0);
  }, [visibleNotifications]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative size-8"
              aria-label={
                unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'
              }
            >
              <Bell className="size-4" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
            : 'Notifications'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className={cn(POPOVER_NOTIFICATION_W, 'p-0')}>
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}
          className="px-2"
        >
          <TabsList className="mt-2 w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
              {unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 min-w-4 justify-center px-1 text-[10px]"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-2">
            <ScrollArea className={SCROLL_MAX_H}>
              <div className="pb-4 pr-2">
                {visibleNotifications.length === 0 ? (
                  <EmptyState
                    contentKey="shell.notifications"
                    icon={BellOff}
                    variant={activeTab === 'unread' ? 'firstRun' : 'noResults'}
                    constraint="1x2"
                  />
                ) : (
                  <div className="space-y-4">
                    {groupedNotifications.map((group) => (
                      <div key={group.label}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </p>
                        <div className="space-y-2">
                          {group.items.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkRead={handleMarkRead}
                              onDismiss={handleDismiss}
                              onClose={() => setOpen(false)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
NotificationPopover.displayName = 'NotificationPopover';

// ─── Individual Notification ─────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({ notification, onMarkRead, onDismiss, onClose }: NotificationItemProps) {
  const isUnread = notification.status === 'unread';
  const SeverityIcon = NOTIFICATION_SEVERITY_ICON[notification.severity];
  const severityColor = NOTIFICATION_SEVERITY_COLOR[notification.severity];
  const bgColor = isUnread ? NOTIFICATION_SEVERITY_BG[notification.severity] : '';

  const timeSince = React.useMemo(
    () => formatRelativeTime(notification.createdAt),
    [notification.createdAt]
  );

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-3 transition-colors',
        bgColor,
        isUnread && 'border-l-2',
        isUnread && notification.severity === 'critical' && 'border-l-destructive',
        isUnread && notification.severity === 'warning' && 'border-l-amber-500',
        isUnread && notification.severity === 'success' && 'border-l-emerald-500',
        isUnread && notification.severity === 'info' && 'border-l-blue-500'
      )}
    >
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 hidden h-6 w-6 text-muted-foreground/60 hover:text-foreground group-hover:flex"
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      <div className="flex gap-3">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          <SeverityIcon className={cn('h-4 w-4', severityColor)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm', isUnread ? 'font-semibold' : 'font-medium')}>
              {notification.title}
            </p>
          </div>

          {notification.body && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
          )}

          <div className="mt-2 flex items-center gap-2">
            {/* Category badge */}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {CATEGORY_LABELS[notification.category]}
            </Badge>

            {/* Timestamp */}
            <span className="text-[10px] text-muted-foreground">
              <Clock className="mr-0.5 inline h-3 w-3" />
              {timeSince}
            </span>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-1">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => onMarkRead(notification.id)}
                >
                  <Check className="mr-0.5 h-3 w-3" />
                  Read
                </Button>
              )}
              {notification.href && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  asChild
                  onClick={onClose}
                >
                  <Link href={notification.href}>View →</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unread indicator dot */}
      {isUnread && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  );
}

// ─── Notification Badge (for header) ─────────────────────────────────────────

interface NotificationBadgeProps {
  unreadCount: number;
  onClick: () => void;
}

/**
 * Bell icon button with unread count badge. Used in the status cluster.
 * Follows shadcn patterns: Tooltip, shell tokens, aria-label.
 */
export function NotificationBadge({ unreadCount, onClick }: NotificationBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative size-8"
          onClick={onClick}
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
          : 'Notifications'}
      </TooltipContent>
    </Tooltip>
  );
}
NotificationBadge.displayName = 'NotificationBadge';
