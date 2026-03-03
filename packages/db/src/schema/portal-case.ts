/**
 * Portal Case Management tables (Phase 1.1 — SP-4001, §7.3, §7.4, §7.5)
 *
 * Three tables:
 *   1. erp.supplier_case        — generalises supplier_dispute with full lifecycle
 *   2. erp.supplier_case_timeline — unified append-only activity stream
 *   3. erp.portal_communication_proof — tamper-evident hash chain
 *
 * All tables are tenant-scoped with RLS enabled.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';
import {
  caseStatusEnum,
  caseCategoryEnum,
  casePriorityEnum,
  caseTimelineEntryTypeEnum,
  caseLinkedEntityTypeEnum,
  portalActorTypeEnum,
  proofEventTypeEnum,
} from './_enums';
import { suppliers } from './erp';

// ─── erp.supplier_case (§7.3 — replaces supplier_dispute) ──────────────────

/**
 * General-purpose portal case — 8-status lifecycle, SLA timers,
 * linked entity references, resolution metadata for training data.
 *
 * Ticket numbers follow SP-1008: `CASE-{TENANT}-{YYYY}-{SEQ}`.
 * Transition rules enforced in application layer via SP-4001 state machine.
 */
export const supplierCases = erpSchema
  .table(
    'supplier_case',
    {
      ...pkId(),
      ...tenantCol(),
      ticketNumber: varchar('ticket_number', { length: 30 }).notNull(),
      supplierId: uuid('supplier_id')
        .notNull()
        .references(() => suppliers.id, { onDelete: 'cascade' }),
      category: caseCategoryEnum('category').notNull(),
      priority: casePriorityEnum('priority').notNull().default('MEDIUM'),
      subject: varchar('subject', { length: 255 }).notNull(),
      description: text('description').notNull(),
      status: caseStatusEnum('status').notNull().default('DRAFT'),
      assignedTo: uuid('assigned_to'),
      coAssignees: uuid('co_assignees')
        .array()
        .notNull()
        .default(sql`'{}'::uuid[]`),
      linkedEntityId: uuid('linked_entity_id'),
      linkedEntityType: caseLinkedEntityTypeEnum('linked_entity_type'),
      slaDeadline: timestamp('sla_deadline', { withTimezone: true }),
      resolution: text('resolution'),
      rootCause: text('root_cause'),
      correctiveAction: text('corrective_action'),
      resolvedBy: uuid('resolved_by'),
      resolvedAt: timestamp('resolved_at', { withTimezone: true }),
      escalationId: uuid('escalation_id'),
      proofChainHead: varchar('proof_chain_head', { length: 64 }),
      createdBy: uuid('created_by').notNull(),
      ...timestamps(),
    },
    (t) => [
      uniqueIndex('uq_supplier_case_ticket').on(t.tenantId, t.ticketNumber),
      index('idx_supplier_case_supplier').on(t.tenantId, t.supplierId),
      index('idx_supplier_case_status').on(t.tenantId, t.status),
      index('idx_supplier_case_category').on(t.tenantId, t.category),
      index('idx_supplier_case_priority').on(t.tenantId, t.priority),
      index('idx_supplier_case_assigned').on(t.tenantId, t.assignedTo),
      index('idx_supplier_case_sla').on(t.tenantId, t.slaDeadline),
      index('idx_supplier_case_linked').on(t.tenantId, t.linkedEntityType, t.linkedEntityId),
    ]
  )
  .enableRLS();

// ─── erp.supplier_case_timeline (§7.4 — canonical append-only stream) ──────

/**
 * Unified timeline for all portal activity on a case.
 *
 * Single storage truth: source-entity tables store their own domain data
 * (message body, file metadata, etc.). Timeline entries **reference** them
 * via ref_id + ref_type — no content duplication.
 *
 * Immutable: rows are never updated or deleted.
 * Every entry links to the proof chain via proof_hash.
 */
export const supplierCaseTimeline = erpSchema
  .table(
    'supplier_case_timeline',
    {
      ...pkId(),
      caseId: uuid('case_id')
        .notNull()
        .references(() => supplierCases.id, { onDelete: 'cascade' }),
      tenantId: uuid('tenant_id').notNull(),
      entryType: caseTimelineEntryTypeEnum('entry_type').notNull(),
      refId: uuid('ref_id'),
      refType: varchar('ref_type', { length: 80 }),
      actorId: uuid('actor_id').notNull(),
      actorType: portalActorTypeEnum('actor_type').notNull(),
      content: jsonb('content').$type<Record<string, unknown>>(),
      proofHash: varchar('proof_hash', { length: 64 }),
      createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .default(sql`now()`),
    },
    (t) => [
      index('idx_case_timeline_case').on(t.caseId, t.createdAt),
      index('idx_case_timeline_tenant').on(t.tenantId, t.caseId),
      index('idx_case_timeline_entry_type').on(t.caseId, t.entryType),
      index('idx_case_timeline_ref').on(t.refType, t.refId),
    ]
  )
  .enableRLS();

// ─── erp.portal_communication_proof (§7.5 — tamper-evident hash chain) ─────

/**
 * Legal-grade tamper-evident proof chain for all portal actions.
 *
 * One chain per tenant (chain_position is tenant-scoped sequence).
 * Cross-supplier entries are interleaved to prevent selective omission.
 *
 * Hash formula (SP-1006):
 *   SHA-256(event_id | event_type | entity_type | entity_id |
 *           actor_type | actor_id | event_at_iso | canonical_json_payload |
 *           previous_hash_or_GENESIS)
 *
 * Daily anchoring: cron job appends DAILY_ANCHOR event with chain digest.
 */
export const portalCommunicationProof = erpSchema
  .table(
    'portal_communication_proof',
    {
      ...pkId(),
      ...tenantCol(),
      chainPosition: bigint('chain_position', { mode: 'bigint' }).notNull(),
      eventType: proofEventTypeEnum('event_type').notNull(),
      entityId: uuid('entity_id').notNull(),
      entityType: varchar('entity_type', { length: 50 }).notNull(),
      actorId: uuid('actor_id').notNull(),
      actorType: portalActorTypeEnum('actor_type').notNull(),
      eventAt: timestamp('event_at', { withTimezone: true }).notNull(),
      payloadCanonical: jsonb('payload_canonical').$type<Record<string, unknown>>(),
      contentHash: varchar('content_hash', { length: 64 }).notNull(),
      previousHash: varchar('previous_hash', { length: 64 }),
      payloadSummary: text('payload_summary'),
      createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .default(sql`now()`),
    },
    (t) => [
      uniqueIndex('uq_proof_chain_position').on(t.tenantId, t.chainPosition),
      index('idx_proof_entity').on(t.tenantId, t.entityType, t.entityId),
      index('idx_proof_chain_tenant').on(t.tenantId, t.chainPosition),
      index('idx_proof_event_type').on(t.tenantId, t.eventType),
    ]
  )
  .enableRLS();
