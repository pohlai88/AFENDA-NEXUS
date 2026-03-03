/**
 * Portal Location & Directory tables (Phase 1.1.5 CAP-LOC + Phase 1.1.6 CAP-DIR + Phase 1.1.7 CAP-INV)
 *
 * Three tables:
 *   1. erp.portal_company_location — buyer's addresses exposed to suppliers
 *   2. erp.portal_directory_entry  — senior management directory with privacy controls
 *   3. erp.portal_supplier_invitation — magic link invitations for new suppliers
 *
 * All tables are tenant-scoped with RLS enabled.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { locationTypeEnum, departmentEnum, invitationStatusEnum } from './_enums';

// ─── erp.portal_company_location (Phase 1.1.5 CAP-LOC) ─────────────────────

/**
 * Buyer's company locations exposed to suppliers for delivery/billing reference.
 * Read-only for suppliers. Buyer maintains via ERP admin (Phase 2).
 *
 * Supports map visualization via lat/lng coordinates.
 * Business hours tracked for supplier convenience.
 */
export const portalCompanyLocations = erpSchema
  .table(
    'portal_company_location',
    {
      ...pkId(),
      ...tenantCol(),
      name: varchar('name', { length: 255 }).notNull(),
      locationType: locationTypeEnum('location_type').notNull(),
      addressLine1: varchar('address_line1', { length: 255 }).notNull(),
      addressLine2: varchar('address_line2', { length: 255 }),
      city: varchar('city', { length: 100 }).notNull(),
      stateProvince: varchar('state_province', { length: 100 }),
      postalCode: varchar('postal_code', { length: 20 }),
      country: varchar('country', { length: 2 }).notNull(), // ISO 3166-1 alpha-2
      latitude: numeric('latitude', { precision: 10, scale: 7 }),
      longitude: numeric('longitude', { precision: 10, scale: 7 }),
      primaryContactName: varchar('primary_contact_name', { length: 255 }),
      primaryContactEmail: varchar('primary_contact_email', { length: 255 }),
      primaryContactPhone: varchar('primary_contact_phone', { length: 50 }),
      businessHoursStart: time('business_hours_start'), // e.g., '09:00:00'
      businessHoursEnd: time('business_hours_end'), // e.g., '17:00:00'
      timezone: varchar('timezone', { length: 50 }), // e.g., 'Asia/Bangkok'
      notes: text('notes'),
      isActive: boolean('is_active').notNull().default(true),
      ...timestamps(),
    },
    (t) => [
      index('idx_portal_company_location_tenant').on(t.tenantId, t.isActive),
      index('idx_portal_company_location_type').on(t.tenantId, t.locationType),
    ]
  )
  .enableRLS();

// ─── erp.portal_directory_entry (Phase 1.1.6 CAP-DIR) ──────────────────────

/**
 * Curated senior management directory for supplier escalations.
 *
 * NOT auto-generated from HR — buyer manually maintains for portal exposure.
 * Privacy controls: email masking, optional phone showing.
 * `isEscalationContact` flag powers P19 CAP-SOS breakglass workflow.
 */
export const portalDirectoryEntries = erpSchema
  .table(
    'portal_directory_entry',
    {
      ...pkId(),
      ...tenantCol(),
      fullName: varchar('full_name', { length: 255 }).notNull(),
      title: varchar('title', { length: 255 }).notNull(),
      department: departmentEnum('department').notNull(),
      emailAddress: varchar('email_address', { length: 255 }).notNull(),
      showFullEmail: boolean('show_full_email').notNull().default(false), // Privacy flag
      phoneNumber: varchar('phone_number', { length: 50 }),
      showPhone: boolean('show_phone').notNull().default(false), // Privacy flag
      availability: varchar('availability', { length: 255 }), // e.g., 'Mon-Fri 9am-5pm'
      timezone: varchar('timezone', { length: 50 }),
      bio: text('bio'), // Brief description of responsibilities
      isEscalationContact: boolean('is_escalation_contact').notNull().default(false), // P19 integration
      displayOrder: integer('display_order').notNull().default(0),
      isActive: boolean('is_active').notNull().default(true),
      ...timestamps(),
    },
    (t) => [
      index('idx_portal_directory_tenant').on(t.tenantId, t.isActive),
      index('idx_portal_directory_department').on(t.tenantId, t.department),
      index('idx_portal_directory_escalation').on(t.tenantId, t.isEscalationContact),
    ]
  )
  .enableRLS();

// ─── erp.portal_supplier_invitation (Phase 1.1.7 CAP-INV) ──────────────────

/**
 * Supplier portal invitations via magic link email.
 * Buyer admins send invitations to prospective suppliers.
 * Token-based authentication (64-char hex, 7-day expiry).
 *
 * Flow: PENDING → ACCEPTED (creates supplier account) or EXPIRED/REVOKED
 */
export const portalSupplierInvitations = erpSchema
  .table(
    'portal_supplier_invitation',
    {
      ...pkId(),
      ...tenantCol(),

      // Invitee Details
      email: varchar('email', { length: 255 }).notNull(),
      supplierName: varchar('supplier_name', { length: 255 }).notNull(), // Suggested name

      // Token (secure random, time-limited)
      token: varchar('token', { length: 64 }).notNull().unique(),
      tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),

      // Status Tracking
      status: invitationStatusEnum('status').notNull().default('PENDING'),
      sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
      acceptedAt: timestamp('accepted_at', { withTimezone: true }),
      revokedAt: timestamp('revoked_at', { withTimezone: true }),

      // Created Supplier Link (after acceptance)
      supplierId: uuid('supplier_id'), // FK to supplier table (nullable until accepted)

      // Audit
      invitedBy: uuid('invited_by').notNull(), // User ID who sent invitation
      invitationMessage: text('invitation_message'), // Optional custom message from buyer

      ...timestamps(),
    },
    (t) => [
      index('idx_portal_invitation_token').on(t.token),
      index('idx_portal_invitation_email').on(t.tenantId, t.email),
      index('idx_portal_invitation_status').on(t.tenantId, t.status),
    ]
  )
  .enableRLS();
