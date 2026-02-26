import { boolean, integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';

// ─── erp.approval_policy ─────────────────────────────────────────────────────

export const approvalPolicies = erpSchema.table('approval_policy', {
  ...pkId(),
  ...tenantCol(),
  companyId: uuid('company_id'),
  entityType: text('entity_type').notNull(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  rules: jsonb('rules').notNull().default([]),
  ...timestamps(),
});

// ─── erp.approval_request ────────────────────────────────────────────────────

export const approvalRequests = erpSchema.table('approval_request', {
  ...pkId(),
  ...tenantCol(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  requestedBy: text('requested_by').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('PENDING'),
  currentStepIndex: integer('current_step_index').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ─── erp.approval_step ──────────────────────────────────────────────────────

export const approvalSteps = erpSchema.table('approval_step', {
  ...pkId(),
  requestId: uuid('request_id').notNull(),
  stepIndex: integer('step_index').notNull(),
  approverId: text('approver_id').notNull(),
  status: text('status').notNull().default('PENDING'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  reason: text('reason'),
  delegatedTo: text('delegated_to'),
});
