'use server';

import { cache } from 'react';
import type {
  Notification,
  NotificationSummary,
} from '@/lib/notifications/notification.types';

// ─── Notification Server Actions ──────────────────────────────────────────────
//
// Returns empty stack until real API is wired. No hardcoded mock data.
// Wire via: const ctx = await getRequestContext(); client.get('/notifications', ...)
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch notification summary (unread count + recent notifications).
 * Returns empty stack until real API is available.
 */
export const getNotificationSummary = cache(async (): Promise<NotificationSummary> => {
  return {
    unreadCount: 0,
    notifications: [] as Notification[],
  };
});

/**
 * Mark a notification as read.
 * No-op until real API is wired.
 */
export async function markNotificationRead(_notificationId: string): Promise<void> {
  // Wire to API when notifications endpoint exists
}

/**
 * Mark all notifications as read.
 * No-op until real API is wired.
 */
export async function markAllNotificationsRead(): Promise<void> {
  // Wire to API when notifications endpoint exists
}

/**
 * Dismiss (archive) a notification.
 * No-op until real API is wired.
 */
export async function dismissNotification(_notificationId: string): Promise<void> {
  // Wire to API when notifications endpoint exists
}
