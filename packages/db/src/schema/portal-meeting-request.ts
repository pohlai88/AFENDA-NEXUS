/**
 * Portal Meeting Request table (Phase 1.2.6 — CAP-APPT P27)
 *
 * Lightweight appointment scheduling: supplier proposes up to 3 time slots,
 * buyer confirms one via ERP-side notification.
 *
 * State machine:
 *   REQUESTED → CONFIRMED → COMPLETED
 *                        ↘ CANCELLED
 *             ↘ CANCELLED
 *
 * proposedTimes: JSONB array of ISO-8601 datetime strings (max 3).
 * confirmedTime: null until buyer picks one of the proposed slots.
 *
 * RLS: tenant-scoped. Suppliers may read/create their own requests;
 * buyers may read all and write status transitions.
 *
 * NOT in scope: recurring meetings, room booking, external calendar sync.
 */
import { index, jsonb, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { meetingRequestStatusEnum, meetingTypeEnum } from './_enums';

// ─── erp.portal_meeting_request ─────────────────────────────────────────────

export const portalMeetingRequests = erpSchema
  .table(
    'portal_meeting_request',
    {
      ...pkId(),
      ...tenantCol(),

      // ── Participants ────────────────────────────────────────────────────
      /** Supplier user ID who created the request. */
      requestedBy: varchar('requested_by', { length: 255 }).notNull(),

      /** Supplier's AP supplier UUID (links to `suppliers` table). */
      supplierId: varchar('supplier_id', { length: 36 }).notNull(),

      /**
       * Buyer-side contact UUID from the directory (CAP-DIR P23).
       * Nullable — buyer may not yet be assigned at request time.
       */
      requestedWith: varchar('requested_with', { length: 36 }),

      // ── Meeting type and logistics ───────────────────────────────────────
      meetingType: meetingTypeEnum('meeting_type').notNull().default('VIRTUAL'),

      /** Human-readable agenda / purpose of the meeting. */
      agenda: text('agenda').notNull(),

      /**
       * For VIRTUAL: meeting link / dial-in (filled by buyer after confirmation).
       * For IN_PERSON: physical address / room.
       */
      location: varchar('location', { length: 500 }),

      // ── Time negotiation ─────────────────────────────────────────────────
      /** JSON array of up to 3 ISO-8601 datetime strings proposed by supplier. */
      proposedTimes: jsonb('proposed_times').$type<string[]>().notNull().default([]),

      /** The ISO-8601 datetime string the buyer confirmed (one of proposedTimes). */
      confirmedTime: timestamp('confirmed_time', { withTimezone: true }),

      // ── Duration ─────────────────────────────────────────────────────────
      /** Requested duration in minutes (15, 30, 45, 60…). */
      durationMinutes: varchar('duration_minutes', { length: 10 }).notNull().default('30'),

      // ── Context links ────────────────────────────────────────────────────
      /** Optional case UUID this meeting is linked to (CAP-CASE). */
      caseId: varchar('case_id', { length: 36 }),

      /** Optional escalation UUID this meeting is linked to (CAP-SOS). */
      escalationId: varchar('escalation_id', { length: 36 }),

      // ── Lifecycle ─────────────────────────────────────────────────────────
      status: meetingRequestStatusEnum('status').notNull().default('REQUESTED'),

      /** Reason if cancelled. */
      cancellationReason: text('cancellation_reason'),

      /** Notes from buyer after confirming. */
      buyerNotes: text('buyer_notes'),

      ...timestamps(),
    },
    (t) => [
      index('idx_meeting_supplier').on(t.tenantId, t.supplierId),
      index('idx_meeting_status').on(t.tenantId, t.status),
      index('idx_meeting_requested_with').on(t.tenantId, t.requestedWith),
    ]
  )
  .enableRLS();

export type PortalMeetingRequestRecord = typeof portalMeetingRequests.$inferSelect;
export type PortalMeetingRequestInsert = typeof portalMeetingRequests.$inferInsert;
