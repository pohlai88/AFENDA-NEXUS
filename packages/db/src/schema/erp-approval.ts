import { boolean, index, integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { pkId, tenantCol, timestamps } from './_common';

// ─── erp.approval_policy ─────────────────────────────────────────────────────

export const approvalPolicies = erpSchema.table('approval_policy', {
  ...pkId(),
  ...tenantCol(),
  companyId: uuid('company_id'),
  entityType: text('entity_type').notNull(),
  name: text('name').notNull(),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  rules: jsonb('rules').notNull().default([]),
  ...timestamps(),
}, (t) => [
  index('idx_approval_policy_entity_type').on(t.tenantId, t.entityType, t.isActive),
  index('idx_approval_policy_company').on(t.tenantId, t.companyId),
]).enableRLS();

// ─── erp.approval_request ────────────────────────────────────────────────────

export const approvalRequests = erpSchema.table('approval_request', {
  ...pkId(),
  ...tenantCol(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  policyId: uuid('policy_id').references(() => approvalPolicies.id, { onDelete: 'set null' }),
  policyVersion: integer('policy_version'),
  requestedBy: text('requested_by').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('PENDING'),
  currentStepIndex: integer('current_step_index').notNull().default(0),
  metadata: jsonb('metadata').notNull().default({}),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => [
  index('idx_approval_request_entity').on(t.tenantId, t.entityType, t.entityId),
  index('idx_approval_request_status').on(t.tenantId, t.status),
  index('idx_approval_request_requester').on(t.tenantId, t.requestedBy),
]).enableRLS();

// ─── erp.approval_step ──────────────────────────────────────────────────────

export const approvalSteps = erpSchema.table('approval_step', {
  ...pkId(),
  requestId: uuid('request_id').notNull().references(() => approvalRequests.id, { onDelete: 'cascade' }),
  stepIndex: integer('step_index').notNull(),
  approverId: text('approver_id').notNull(),
  status: text('status').notNull().default('PENDING'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  reason: text('reason'),
  ...tenantCol(),
  delegatedTo: text('delegated_to'),
}, (t) => [
  index('idx_approval_step_request').on(t.tenantId, t.requestId),
  index('idx_approval_step_approver_status').on(t.tenantId, t.approverId, t.status),
]).enableRLS();
