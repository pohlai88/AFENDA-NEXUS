/**
 * Portal Announcement table (Phase 1.2.3 — CAP-ANNOUNCE P24)
 *
 * Buyer admin creates tenant-scoped announcements that display to all
 * suppliers in the portal. Pinned announcements appear as a persistent
 * banner across every portal page; regular ones appear on the dashboard.
 *
 * Severity controls visual treatment:
 *   INFO     → blue informational banner
 *   WARNING  → amber attention banner
 *   CRITICAL → red urgent banner (e.g. service outage, deadline)
 *
 * validFrom / validUntil control display window. Announcements outside
 * the window are hidden automatically — no manual cleanup needed.
 *
 * RLS: tenant-scoped. Suppliers can only read; buyers write.
 */
import { boolean, index, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { announcementSeverityEnum } from './_enums';

// ─── erp.portal_announcement ────────────────────────────────────────────────

export const portalAnnouncements = erpSchema
  .table(
    'portal_announcement',
    {
      ...pkId(),
      ...tenantCol(),

      // ── Content ──────────────────────────────────────────────────────
      /** Short headline shown in banner and list title. Max 120 chars enforced at contract. */
      title: varchar('title', { length: 120 }).notNull(),

      /** Rich-text body (stored as plain text / markdown-safe string). */
      body: text('body').notNull(),

      // ── Display control ───────────────────────────────────────────────
      severity: announcementSeverityEnum('severity').notNull().default('INFO'),

      /**
       * Pinned announcements appear as a persistent banner across ALL portal
       * pages until validUntil expires or pinned is set to false.
       * Non-pinned announcements appear on the dashboard only.
       */
      pinned: boolean('pinned').notNull().default(false),

      // ── Validity window ───────────────────────────────────────────────
      /** Start of display window. Defaults to now() at creation. */
      validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),

      /**
       * End of display window. NULL = no expiry (show indefinitely while active).
       * Announcements past validUntil are excluded from queries automatically.
       */
      validUntil: timestamp('valid_until', { withTimezone: true }),

      // ── Authorship (buyer-side user ID) ──────────────────────────────
      createdBy: varchar('created_by', { length: 255 }).notNull(),

      // ── Soft delete ───────────────────────────────────────────────────
      /** Set by DELETE action. Hidden from supplier queries when archived. */
      archivedAt: timestamp('archived_at', { withTimezone: true }),

      ...timestamps(),
    },
    (t) => [
      index('idx_announcement_tenant_active').on(
        t.tenantId,
        t.archivedAt,
        t.validFrom,
        t.validUntil
      ),
      index('idx_announcement_pinned').on(t.tenantId, t.pinned, t.archivedAt),
      index('idx_announcement_severity').on(t.tenantId, t.severity),
    ]
  )
  .enableRLS();

export type PortalAnnouncementRecord = typeof portalAnnouncements.$inferSelect;
export type PortalAnnouncementInsert = typeof portalAnnouncements.$inferInsert;
