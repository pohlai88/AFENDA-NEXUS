/**
 * SP-3005: CAP-PAY-ETA — Payment Status Fact Table (Phase 1.4.1)
 *
 * Append-only, SOX-safe payment status timeline. No UPDATEs.
 * Source precedence: BANK_FILE > ERP > MANUAL_OVERRIDE (SP-4002).
 *
 * §7.2 of supplier-portal2.0-V2.md
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { holdReasonEnum, paymentSourceEnum, paymentStageEnum, portalActorTypeEnum } from './_enums';

/**
 * Immutable payment status fact — one row per status transition event.
 * Reading the timeline = querying rows ordered by created_at for a given
 * payment_id.
 */
export const supplierPaymentStatusFacts = erpSchema
  .table(
    'supplier_payment_status_fact',
    {
      ...pkId(),
      ...tenantCol(),

      /** Payment run ID from the ERP payment run table. */
      paymentRunId: uuid('payment_run_id').notNull(),

      /** Optional link to a specific invoice within the payment run. */
      invoiceId: uuid('invoice_id'),

      /** Supplier this fact belongs to — for fast scoped queries. */
      supplierId: uuid('supplier_id').notNull(),

      /** The new stage recorded by this fact entry. */
      stage: paymentStageEnum('stage').notNull(),

      /** The stage before this transition (null for the first fact). */
      previousStage: paymentStageEnum('previous_stage'),

      /** When the stage change occurred (server UTC). */
      eventAt: timestamp('event_at', { withTimezone: true }).notNull(),

      /**
       * Source of this update. Determines override precedence.
       * BANK_FILE > ERP > MANUAL_OVERRIDE.
       */
      source: paymentSourceEnum('source').notNull(),

      /**
       * Numeric precedence stored for efficient comparison:
       * 3 = BANK_FILE, 2 = ERP, 1 = MANUAL_OVERRIDE.
       */
      sourcePrecedence: smallint('source_precedence').notNull(),

      /**
       * Bank trace number, ERP batch reference, or MT file identifier.
       * Populated by bank file parsers or ERP integration.
       */
      reference: varchar('reference', { length: 255 }),

      /**
       * Internal hold reason — only used when stage = ON_HOLD.
       * Never exposed raw to supplier UI (gate SP-8025).
       */
      holdReason: holdReasonEnum('hold_reason'),

      /**
       * Supplier-visible status label (from Status Dictionary SP-1003).
       * This is the only label the supplier UI should render.
       */
      supplierVisibleLabel: varchar('supplier_visible_label', { length: 120 }),

      /**
       * Deep link to the next action (case thread, compliance page, etc.).
       * Used by the "Why am I not paid?" panel.
       */
      nextActionHref: varchar('next_action_href', { length: 512 }),

      /** Human-readable note (internal — not shown to supplier). */
      note: text('note'),

      /**
       * Case ID if this event is linked to an active case (auto-escalation path).
       * When populated, this fact appears in the unified case timeline (§2.4).
       */
      linkedCaseId: uuid('linked_case_id'),

      /**
       * Whether the AP team is aware of this hold and has a case in progress.
       * Drives auto-escalation timer.
       */
      isUnderReview: boolean('is_under_review').notNull().default(false),

      /** Days the payment has been on hold (computed at insert time). */
      holdDurationDays: integer('hold_duration_days'),

      /**
       * The actor who created this fact entry.
       * SYSTEM = automated BANK_FILE parser / cron. BUYER = AP clerk override.
       */
      createdBy: uuid('created_by').notNull(),
      createdByType: portalActorTypeEnum('created_by_type').notNull().default('SYSTEM'),

      /**
       * Canonical JSON payload used by the proof chain writer (SP-1006).
       * Stored for hash recomputation during verification.
       */
      proofPayloadCanonical: jsonb('proof_payload_canonical'),

      ...timestamps(),
    },
    (t) => [
      // Fast lookup by payment run (primary read path)
      index('sppsf_payment_run_idx').on(t.tenantId, t.paymentRunId),
      // Lookup by invoice (secondary read path)
      index('sppsf_invoice_idx').on(t.tenantId, t.invoiceId),
      // Lookup by supplier (dashboard payment tracking)
      index('sppsf_supplier_idx').on(t.tenantId, t.supplierId),
      // Linked case resolution (timeline hydration) — covering index
      index('sppsf_case_idx').on(t.linkedCaseId),
      // Chronological ordering per payment run (timeline render)
      index('sppsf_event_at_idx').on(t.tenantId, t.paymentRunId, t.eventAt),
    ]
  )
  .enableRLS();

export type SupplierPaymentStatusFact = typeof supplierPaymentStatusFacts.$inferSelect;
export type NewSupplierPaymentStatusFact = typeof supplierPaymentStatusFacts.$inferInsert;

// ─── CAP-SCF (P3): Early Payment Offer ─────────────────────────────────────

/**
 * SP-3008: Early payment offer table for Supply Chain Finance (CAP-SCF P3).
 * Match-clean invoices only. Immutable once accepted.
 * Phase 1.4.2 (§5 supplier-portal2.0-V2.md).
 */
export const earlyPaymentOffers = erpSchema
  .table(
    'early_payment_offer',
    {
      ...pkId(),
      ...tenantCol(),

      /** Invoice being offered early payment. Must be match-clean. */
      invoiceId: uuid('invoice_id').notNull(),

      /** Supplier receiving the offer. */
      supplierId: uuid('supplier_id').notNull(),

      /**
       * Offer expiry date. After this, offer can no longer be accepted.
       * Early payment date if accepted.
       */
      offerExpiresAt: timestamp('offer_expires_at', { withTimezone: true }).notNull(),

      /**
       * Proposed early payment date if supplier accepts.
       */
      proposedPaymentDate: timestamp('proposed_payment_date', { withTimezone: true }).notNull(),

      /**
       * Original due date of the invoice (for reference / display).
       */
      originalDueDate: timestamp('original_due_date', { withTimezone: true }).notNull(),

      /**
       * Discount rate as basis points (e.g., 50 = 0.50% flat discount).
       * Presented as APR or flat % depending on `pricingType`.
       */
      discountBps: integer('discount_bps').notNull(),

      /**
       * APR percentage (annualized) — informational display for supplier.
       * Stored as integer basis points (e.g., 1250 = 12.50% APR).
       */
      aprBps: integer('apr_bps').notNull(),

      /**
       * Pricing type: 'APR' (annualized rate) or 'FLAT' (flat percentage).
       */
      pricingType: varchar('pricing_type', { length: 10 }).notNull().default('APR'),

      /**
       * Invoice face value in minor currency units (bigint).
       */
      invoiceAmountMinor: varchar('invoice_amount_minor', { length: 30 }).notNull(),

      /**
       * Discount amount in minor currency units.
       */
      discountAmountMinor: varchar('discount_amount_minor', { length: 30 }).notNull(),

      /**
       * Net early payment amount (invoice - discount).
       */
      netPaymentAmountMinor: varchar('net_payment_amount_minor', { length: 30 }).notNull(),

      currency: varchar('currency', { length: 3 }).notNull(),

      /**
       * Status: PENDING → ACCEPTED | EXPIRED | DECLINED.
       */
      status: varchar('status', { length: 20 }).notNull().default('PENDING'),

      /**
       * When the supplier accepted the offer (if applicable).
       */
      acceptedAt: timestamp('accepted_at', { withTimezone: true }),

      /**
       * The supplier user who accepted.
       */
      acceptedByPortalUserId: uuid('accepted_by_portal_user_id'),

      /**
       * GL impact configuration reference (tenant-specific, set up at onboarding).
       * References GL account mapping for discount expense booking.
       */
      glConfigRef: varchar('gl_config_ref', { length: 100 }),

      /**
       * Immutable once accepted — soft-lock. Cannot modify accepted offers.
       */
      isImmutable: boolean('is_immutable').notNull().default(false),

      createdBy: uuid('created_by').notNull(),
      ...timestamps(),
    },
    (t) => [
      index('epo_invoice_idx').on(t.tenantId, t.invoiceId),
      index('epo_supplier_idx').on(t.tenantId, t.supplierId),
      index('epo_status_idx').on(t.tenantId, t.status),
    ]
  )
  .enableRLS();

export type EarlyPaymentOffer = typeof earlyPaymentOffers.$inferSelect;
export type NewEarlyPaymentOffer = typeof earlyPaymentOffers.$inferInsert;
