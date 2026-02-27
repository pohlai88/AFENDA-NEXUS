// ─── Notification Types ───────────────────────────────────────────────────────
//
// Client-side notification types for the shell notification center.
// Maps to the DB notification schema in packages/db/src/schema/notification.ts.
//
// ─────────────────────────────────────────────────────────────────────────────

/** Notification severity levels. */
export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

/** Notification read/archive status. */
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';

/** Notification category for filtering. */
export type NotificationCategory =
  | 'approval'
  | 'system'
  | 'finance'
  | 'alert'
  | 'activity';

/**
 * A single notification rendered in the notification center.
 */
export interface Notification {
  /** Unique identifier. */
  id: string;
  /** Short title. */
  title: string;
  /** Optional longer body text. */
  body?: string;
  /** Category for grouping / filtering. */
  category: NotificationCategory;
  /** Visual severity. */
  severity: NotificationSeverity;
  /** Read status. */
  status: NotificationStatus;
  /** Deep link within the app. */
  href?: string;
  /** Lucide icon name. */
  icon?: string;
  /** Source entity type (for linking). */
  sourceType?: string;
  /** Source entity ID. */
  sourceId?: string;
  /** When the notification was created. */
  createdAt: string;
  /** When the notification was read (null if unread). */
  readAt?: string | null;
}

/**
 * Notification summary for the shell badge.
 */
export interface NotificationSummary {
  /** Total unread count. */
  unreadCount: number;
  /** Notifications to display (most recent first). */
  notifications: Notification[];
}

/**
 * Category labels for display.
 */
export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  approval: 'Approvals',
  system: 'System',
  finance: 'Finance',
  alert: 'Alerts',
  activity: 'Activity',
};

/**
 * Severity icon names for display.
 */
export const SEVERITY_ICONS: Record<NotificationSeverity, string> = {
  info: 'Info',
  warning: 'AlertTriangle',
  critical: 'AlertOctagon',
  success: 'CheckCircle2',
};
