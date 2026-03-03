/**
 * SP-3014: portal_brand_config table (CAP-BRAND)
 *
 * Stores per-tenant white-label branding configuration for the supplier portal.
 * All color fields are persisted as hex strings (#rrggbb).
 * logoUrl points to an R2/S3 presigned URL or a CDN path.
 *
 * Design constraints:
 *   - One row per tenant (UNIQUE on tenantId).
 *   - Soft-delete via archivedAt; active config = archivedAt IS NULL.
 *   - Primary color is applied as a CSS custom-property override at the portal
 *     shell level, not globally — only affects the supplier portal.
 */
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const portalBrandConfig = pgTable('portal_brand_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique(),

  // Buyer-facing brand name displayed in the portal header (falls back to tenant name)
  portalDisplayName: text('portal_display_name'),

  // Logo URL (SVG preferred, PNG fallback) stored in object storage
  logoUrl: text('logo_url'),
  logoAltText: text('logo_alt_text'),

  // Colors — hex #rrggbb format
  // primaryColor maps to --brand-primary (CSS var override in portal scope)
  primaryColor: text('primary_color'),
  primaryForegroundColor: text('primary_foreground_color'),
  accentColor: text('accent_color'),

  // Footer / support info shown in the portal shell
  supportEmail: text('support_email'),
  supportPhone: text('support_phone'),
  supportUrl: text('support_url'),

  // Audit
  createdBy: text('created_by').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type PortalBrandConfig = typeof portalBrandConfig.$inferSelect;
export type NewPortalBrandConfig = typeof portalBrandConfig.$inferInsert;
