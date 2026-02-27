import {
  getNotificationSummary,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from '@/lib/notifications/notification.actions';
import type {
  Notification,
  NotificationSummary,
} from '@/lib/notifications/notification.types';
import {
  CATEGORY_LABELS,
  SEVERITY_ICONS,
} from '@/lib/notifications/notification.types';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('notification.actions', () => {
  describe('getNotificationSummary', () => {
    it('returns a valid NotificationSummary shape', async () => {
      const summary = await getNotificationSummary();
      expect(summary).toHaveProperty('unreadCount');
      expect(summary).toHaveProperty('notifications');
      expect(typeof summary.unreadCount).toBe('number');
      expect(Array.isArray(summary.notifications)).toBe(true);
    });

    it('unreadCount matches the actual unread notifications', async () => {
      const summary = await getNotificationSummary();
      const actual = summary.notifications.filter((n) => n.status === 'unread').length;
      expect(summary.unreadCount).toBe(actual);
    });

    it('notifications have required fields', async () => {
      const { notifications } = await getNotificationSummary();
      for (const n of notifications) {
        expect(n.id).toBeDefined();
        expect(n.title).toBeTruthy();
        expect(n.category).toBeDefined();
        expect(n.severity).toBeDefined();
        expect(n.status).toBeDefined();
        expect(n.createdAt).toBeDefined();
      }
    });

    it('createdAt is a valid ISO date string', async () => {
      const { notifications } = await getNotificationSummary();
      for (const n of notifications) {
        const date = new Date(n.createdAt);
        expect(date.getTime()).not.toBeNaN();
      }
    });
  });

  describe('markNotificationRead', () => {
    it('does not throw for a valid notification id', async () => {
      await expect(markNotificationRead('notif-001')).resolves.toBeUndefined();
    });

    it('does not throw for an unknown id', async () => {
      await expect(markNotificationRead('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('markAllNotificationsRead', () => {
    it('does not throw', async () => {
      await expect(markAllNotificationsRead()).resolves.toBeUndefined();
    });
  });

  describe('dismissNotification', () => {
    it('does not throw for a valid notification id', async () => {
      await expect(dismissNotification('notif-001')).resolves.toBeUndefined();
    });
  });
});

describe('notification.types', () => {
  it('CATEGORY_LABELS covers all known categories', () => {
    const categories = ['approval', 'system', 'finance', 'alert', 'activity'] as const;
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it('SEVERITY_ICONS covers all severity levels', () => {
    const severities = ['info', 'warning', 'critical', 'success'] as const;
    for (const sev of severities) {
      expect(SEVERITY_ICONS[sev]).toBeTruthy();
    }
  });
});
