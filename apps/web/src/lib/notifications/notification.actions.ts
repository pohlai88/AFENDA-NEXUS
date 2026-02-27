'use server';

import type {
  Notification,
  NotificationSummary,
} from '@/lib/notifications/notification.types';

// ─── Notification Server Actions ──────────────────────────────────────────────
//
// Server actions for notification CRUD. Currently stubbed with demo data.
// Wire to real DB queries via createApiClient(ctx) when ready.
//
// TODO: Replace stubs with real queries:
//   const ctx = await getRequestContext();
//   const client = createApiClient(ctx);
//   return client.get('/notifications', { status: 'UNREAD', limit: 20 });
//
// ─────────────────────────────────────────────────────────────────────────────

/** Stub notifications for development. */
const STUB_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    title: 'Invoice INV-2026-0142 Approved',
    body: 'The invoice from Acme Corporation for $14,500 has been approved and is ready for payment.',
    category: 'approval',
    severity: 'success',
    status: 'unread',
    href: '/finance/payables/inv-2026-0142',
    icon: 'CheckCircle2',
    sourceType: 'invoice',
    sourceId: 'inv-2026-0142',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    readAt: null,
  },
  {
    id: 'notif-002',
    title: 'New Approval Request',
    body: 'Journal entry JE-2026-005 (FX Revaluation) requires your approval. Amount: $45,200.',
    category: 'approval',
    severity: 'warning',
    status: 'unread',
    href: '/finance/approvals',
    icon: 'Clock',
    sourceType: 'journal',
    sourceId: 'je-2026-005',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    readAt: null,
  },
  {
    id: 'notif-003',
    title: 'Period Close Reminder',
    body: 'Fiscal period Q4-2025 ended 5 days ago and has not been closed yet.',
    category: 'finance',
    severity: 'warning',
    status: 'unread',
    href: '/finance/periods',
    icon: 'CalendarDays',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    readAt: null,
  },
  {
    id: 'notif-004',
    title: 'Reconciliation Complete',
    body: 'Auto-reconciliation matched 23 bank transactions. 5 items remain unmatched.',
    category: 'finance',
    severity: 'info',
    status: 'read',
    href: '/finance/banking/reconcile',
    icon: 'ArrowLeftRight',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    readAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-005',
    title: 'System Maintenance Scheduled',
    body: 'Scheduled maintenance window: Saturday 2026-03-01, 02:00-04:00 UTC.',
    category: 'system',
    severity: 'info',
    status: 'read',
    href: undefined,
    icon: 'Wrench',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-006',
    title: 'Budget Threshold Alert',
    body: 'Marketing department has reached 92% of its monthly budget allocation.',
    category: 'alert',
    severity: 'critical',
    status: 'unread',
    href: '/finance/budgets',
    icon: 'AlertOctagon',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    readAt: null,
  },
];

/**
 * Fetch notification summary (unread count + recent notifications).
 */
export async function getNotificationSummary(): Promise<NotificationSummary> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 100));

  return {
    unreadCount: STUB_NOTIFICATIONS.filter((n) => n.status === 'unread').length,
    notifications: STUB_NOTIFICATIONS,
  };
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 50));

  const notif = STUB_NOTIFICATIONS.find((n) => n.id === notificationId);
  if (notif) {
    notif.status = 'read';
    notif.readAt = new Date().toISOString();
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 100));

  for (const notif of STUB_NOTIFICATIONS) {
    if (notif.status === 'unread') {
      notif.status = 'read';
      notif.readAt = new Date().toISOString();
    }
  }
}

/**
 * Dismiss (archive) a notification.
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 50));

  const notif = STUB_NOTIFICATIONS.find((n) => n.id === notificationId);
  if (notif) {
    notif.status = 'dismissed';
  }
}
