/**
 * Portal Escalation table (Phase 1.2.2 — CAP-SOS P19 Breakglass)
 *
 * Every supplier escalation is anchored to a supplier_case.
 * Escalation contacts are pulled from supplier_directory_entry WHERE isEscalationContact = true.
 *
 * SLA invariant:
 *   respondByAt = triggeredAt + 48 hours
 *   resolveByAt = triggeredAt + 5 days
 *
 * Status lifecycle:
 *   ESCALATION_REQUESTED → ESCALATION_ASSIGNED → ESCALATION_IN_PROGRESS → ESCALATION_RESOLVED
 *
 * Proof chain: ESCALATION_TRIGGERED on create, ESCALATION_RESOLVED on resolve.
 */
import { index, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import { escalationStatusEnum } from './_enums';
import { supplierCases } from './portal-case';
import { suppliers } from './erp';

// ─── erp.supplier_escalation ────────────────────────────────────────────────

/**
 * Escalation record — immutable once RESOLVED.
 * `triggeredBy` is the supplier portal user who clicked the SOS button.
 * `assignedTo` is a directory entry id (isEscalationContact=true).
 */
export const supplierEscalations = erpSchema
  .table(
    'supplier_escalation',
    {
      ...pkId(),
      ...tenantCol(),

      // ── Core relationships ─────────────────────────────────────────────
      caseId: uuid('case_id')
        .notNull()
        .references(() => supplierCases.id, { onDelete: 'cascade' }),
      supplierId: uuid('supplier_id')
        .notNull()
        .references(() => suppliers.id, { onDelete: 'cascade' }),

      // ── Participants ───────────────────────────────────────────────────
      /** Portal user ID who clicked the SOS / triggered escalation */
      triggeredBy: uuid('triggered_by').notNull(),
      /** Directory entry ID (portalDirectoryEntries.id) for the assigned contact */
      assignedTo: uuid('assigned_to'),
      assignedAt: timestamp('assigned_at', { withTimezone: true }),

      // ── Status ────────────────────────────────────────────────────────
      status: escalationStatusEnum('status').notNull().default('ESCALATION_REQUESTED'),

      // ── Supplier-stated reason ─────────────────────────────────────────
      reason: text('reason').notNull(), // Min 10 chars enforced at contract layer

      // ── SLA clocks ────────────────────────────────────────────────────
      /** Hard SLA: buyer must respond within 48h of trigger */
      respondByAt: timestamp('respond_by_at', { withTimezone: true }).notNull(),
      /** Hard SLA: issue must be resolved within 5 days of trigger */
      resolveByAt: timestamp('resolve_by_at', { withTimezone: true }).notNull(),

      // ── Resolution ────────────────────────────────────────────────────
      resolvedAt: timestamp('resolved_at', { withTimezone: true }),
      resolutionNotes: text('resolution_notes'),

      // ── Proof chain ───────────────────────────────────────────────────
      /** SHA-256 of the proof chain entry created at trigger time */
      proofHash: varchar('proof_hash', { length: 64 }),

      ...timestamps(),
    },
    (t) => [
      index('idx_escalation_case').on(t.tenantId, t.caseId),
      index('idx_escalation_supplier').on(t.tenantId, t.supplierId),
      index('idx_escalation_status').on(t.tenantId, t.status),
      index('idx_escalation_assigned').on(t.tenantId, t.assignedTo),
      index('idx_escalation_sla').on(t.tenantId, t.resolveByAt),
    ]
  )
  .enableRLS();
