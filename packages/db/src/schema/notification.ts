import { boolean, index, jsonb, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { platformSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';

// ─── Notification Enums ──────────────────────────────────────────────────────

import { pgEnum } from 'drizzle-orm/pg-core';

export const notificationChannelEnum = pgEnum('notification_channel', [
  'IN_APP',
  'EMAIL',
  'PUSH',
]);

export const notificationSeverityEnum = pgEnum('notification_severity', [
  'INFO',
  'WARNING',
  'CRITICAL',
  'SUCCESS',
]);

export const notificationStatusEnum = pgEnum('notification_status', [
  'UNREAD',
  'READ',
  'ARCHIVED',
  'DISMISSED',
]);

export const notificationCategoryEnum = pgEnum('notification_category', [
  'APPROVAL',
  'SYSTEM',
  'FINANCE',
  'ALERT',
  'ACTIVITY',
]);

// ─── Notifications Table ─────────────────────────────────────────────────────

/**
 * Platform-level in-app notifications.
 *
 * Each notification targets a specific user within a tenant.
 * Notifications are tenant-scoped for multi-tenancy isolation.
 */
export const notifications = platformSchema.table(
  'notifications',
  {
    ...pkId(),
    ...tenantCol(),

    /** Target user for this notification. */
    userId: uuid('user_id').notNull(),

    /** Short title (e.g. "Invoice Approved"). */
    title: varchar('title', { length: 256 }).notNull(),

    /** Longer description body. */
    body: text('body'),

    /** Notification category for filtering. */
    category: notificationCategoryEnum('category').notNull().default('SYSTEM'),

    /** Visual severity level. */
    severity: notificationSeverityEnum('severity').notNull().default('INFO'),

    /** Read/unread/archived status. */
    status: notificationStatusEnum('status').notNull().default('UNREAD'),

    /** Deep link within the app (e.g. "/finance/approvals/abc-123"). */
    href: varchar('href', { length: 512 }),

    /** Icon name from the icon registry (Lucide). */
    icon: varchar('icon', { length: 64 }),

    /** Structured metadata for extensibility. */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    /** Source entity type (e.g. "journal", "invoice"). */
    sourceType: varchar('source_type', { length: 64 }),

    /** Source entity ID for linking. */
    sourceId: uuid('source_id'),

    /** Whether this notification has been read. */
    readAt: timestamp('read_at', { withTimezone: true }),

    /**
     * Deduplication key — prevents notification spam.
     * Example: `overdue:INV-001` so the same invoice doesn't generate multiple alerts.
     * Combined with a unique partial index where dismissedAt IS NULL.
     */
    dedupeKey: varchar('dedupe_key', { length: 256 }),

    /** Dismissed timestamp — null if not dismissed. */
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),

    /**
     * Scopes notification to a specific company within the tenant.
     * Nullable — some notifications (system, announcements) are tenant-wide.
     */
    companyId: uuid('company_id'),

    ...timestamps(),
  },
  (table) => [
    index('notifications_user_idx').on(table.tenantId, table.userId),
    index('notifications_status_idx').on(table.tenantId, table.userId, table.status),
    index('notifications_created_idx').on(table.tenantId, table.userId, table.createdAt),
    index('notifications_dismissed_idx').on(table.tenantId, table.userId, table.dismissedAt),
  ],
);

// ─── Notification Preferences Table ──────────────────────────────────────────

/**
 * Per-user notification preferences.
 * Controls which channels and categories a user wants to receive.
 */
export const notificationPreferences = platformSchema.table(
  'notification_preferences',
  {
    ...pkId(),
    ...tenantCol(),

    /** User whose preferences these are. */
    userId: uuid('user_id').notNull(),

    /** Notification category (e.g. APPROVAL, FINANCE). */
    category: notificationCategoryEnum('category').notNull(),

    /** Whether in-app notifications are enabled for this category. */
    inApp: boolean('in_app').notNull().default(true),

    /** Whether email notifications are enabled for this category. */
    email: boolean('email').notNull().default(false),

    /** Whether push notifications are enabled for this category. */
    push: boolean('push').notNull().default(false),

    ...timestamps(),
  },
  (table) => [
    index('notification_prefs_user_idx').on(table.tenantId, table.userId),
  ],
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const notificationsRelations = relations(notifications, ({ one }) => ({
  // Add FK relations when wiring to users table
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    // Add FK relations when wiring to users table
  }),
);
