'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/modules/icon-map';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  Clock,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  getNotificationSummary,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from '@/lib/notifications/notification.actions';
import type {
  Notification,
  NotificationSeverity,
  NotificationCategory,
} from '@/lib/notifications/notification.types';
import { CATEGORY_LABELS } from '@/lib/notifications/notification.types';

// ─── Severity Styling ────────────────────────────────────────────────────────

const SEVERITY_ICON: Record<NotificationSeverity, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
  success: CheckCircle2,
};

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  critical: 'text-destructive',
  success: 'text-emerald-500',
};

const SEVERITY_BG: Record<NotificationSeverity, string> = {
  info: 'bg-blue-50 dark:bg-blue-950/30',
  warning: 'bg-amber-50 dark:bg-amber-950/30',
  critical: 'bg-destructive/5 dark:bg-destructive/10',
  success: 'bg-emerald-50 dark:bg-emerald-950/30',
};

// ─── NotificationCenter ─────────────────────────────────────────────────────

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Notification center Sheet (right slide-out panel).
 * Shows all notifications with filtering by category and read/unread tabs.
 */
export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isPending, startTransition] = useTransition();

  // Fetch notifications when sheet opens
  const fetchNotifications = useCallback(async () => {
    try {
      const summary = await getNotificationSummary();
      setNotifications(summary.notifications);
      setUnreadCount(summary.unreadCount);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => { await fetchNotifications(); });
  }, [open, fetchNotifications]);

  // Client polling — refresh every 60s while sheet is open
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      startTransition(async () => { await fetchNotifications(); });
    }, 60_000);
    return () => clearInterval(interval);
  }, [open, fetchNotifications]);

  const handleMarkRead = useCallback(
    (id: string) => {
      startTransition(async () => {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, status: 'read' as const, readAt: new Date().toISOString() } : n,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      });
    },
    [],
  );

  const handleMarkAllRead = useCallback(() => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: 'read' as const,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
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
    [notifications],
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
      if (ts >= todayStart) groups[0]!.items.push(n);
      else if (ts >= yesterdayStart) groups[1]!.items.push(n);
      else groups[2]!.items.push(n);
    }

    return groups.filter((g) => g.items.length > 0);
  }, [visibleNotifications]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
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
          <SheetDescription className="sr-only">
            View and manage your notifications
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}
          className="mt-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 justify-center px-1 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-3">
            <ScrollArea className="h-[calc(100vh-14rem)]">
              {visibleNotifications.length === 0 ? (
                <EmptyNotifications tab={activeTab} />
              ) : (
                <div className="space-y-4 pr-4">
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
                            onClose={() => onOpenChange(false)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
NotificationCenter.displayName = 'NotificationCenter';

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyNotifications({ tab }: { tab: 'all' | 'unread' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <BellOff className="h-10 w-10 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-medium">
          {tab === 'unread' ? 'All caught up!' : 'No notifications'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {tab === 'unread'
            ? 'You have no unread notifications.'
            : 'Notifications will appear here when there are updates.'}
        </p>
      </div>
    </div>
  );
}

// ─── Individual Notification ─────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
  onClose,
}: NotificationItemProps) {
  const isUnread = notification.status === 'unread';
  const SeverityIcon = SEVERITY_ICON[notification.severity];
  const severityColor = SEVERITY_COLOR[notification.severity];
  const bgColor = isUnread ? SEVERITY_BG[notification.severity] : '';

  const timeSince = React.useMemo(() => {
    const diffMs = Date.now() - new Date(notification.createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [notification.createdAt]);

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-3 transition-colors',
        bgColor,
        isUnread && 'border-l-2',
        isUnread && notification.severity === 'critical' && 'border-l-destructive',
        isUnread && notification.severity === 'warning' && 'border-l-amber-500',
        isUnread && notification.severity === 'success' && 'border-l-emerald-500',
        isUnread && notification.severity === 'info' && 'border-l-blue-500',
      )}
    >
      {/* Dismiss button */}
      <button
        className="absolute right-2 top-2 hidden rounded-sm p-0.5 text-muted-foreground/60 hover:text-foreground group-hover:block"
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

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
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {notification.body}
            </p>
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
 */
export function NotificationBadge({ unreadCount, onClick }: NotificationBadgeProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-8 w-8"
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
NotificationBadge.displayName = 'NotificationBadge';
