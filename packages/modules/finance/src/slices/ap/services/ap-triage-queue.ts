import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TriageAssignment {
  readonly invoiceId: string;
  readonly assignedTo: string;
  readonly assignedBy: string;
  readonly reason: string | null;
  readonly assignedAt: Date;
}

export interface ITriageAssignmentRepo {
  assign(input: {
    tenantId: string;
    invoiceId: string;
    assignedTo: string;
    assignedBy: string;
    reason: string | null;
  }): Promise<TriageAssignment>;
  findByInvoiceId(invoiceId: string): Promise<TriageAssignment | null>;
  findByAssignee(tenantId: string, assignedTo: string): Promise<readonly TriageAssignment[]>;
  unassign(invoiceId: string): Promise<void>;
}

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface MarkIncompleteInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly reason: string;
  readonly correlationId?: string;
}

export interface AssignTriageInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly assignTo: string;
  readonly reason: string | null;
  readonly correlationId?: string;
}

export interface ResolveTriageInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly targetStatus: 'DRAFT' | 'PENDING_APPROVAL';
  readonly correlationId?: string;
}

export interface TriageQueueQuery {
  readonly tenantId: string;
  readonly assignedTo?: string;
}

// ─── Services ───────────────────────────────────────────────────────────────

/**
 * B2: Mark an invoice as INCOMPLETE — moves it to the triage queue.
 *
 * Only DRAFT or PENDING_APPROVAL invoices can be marked incomplete.
 */
export async function markInvoiceIncomplete(
  input: MarkIncompleteInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<ApInvoice>> {
  if (!input.reason.trim()) {
    return err(new AppError('VALIDATION', 'Reason is required when marking invoice incomplete'));
  }

  const found = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found;

  const invoice = found.value;
  if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING_APPROVAL') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Only DRAFT or PENDING_APPROVAL invoices can be marked incomplete, current: ${invoice.status}`
      )
    );
  }

  const updated = await deps.apInvoiceRepo.updateStatus(input.invoiceId, 'INCOMPLETE');
  if (!updated.ok) return updated;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_INVOICE_MARKED_INCOMPLETE,
    payload: {
      invoiceId: input.invoiceId,
      reason: input.reason,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return updated;
}

/**
 * B2: Assign an INCOMPLETE invoice to a user for resolution.
 */
export async function assignTriageInvoice(
  input: AssignTriageInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    triageAssignmentRepo: ITriageAssignmentRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<TriageAssignment>> {
  const found = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found as Result<never>;

  if (found.value.status !== 'INCOMPLETE') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Invoice must be INCOMPLETE to assign, current: ${found.value.status}`
      )
    );
  }

  const assignment = await deps.triageAssignmentRepo.assign({
    tenantId: input.tenantId,
    invoiceId: input.invoiceId,
    assignedTo: input.assignTo,
    assignedBy: input.userId,
    reason: input.reason,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_TRIAGE_ASSIGNED,
    payload: {
      invoiceId: input.invoiceId,
      assignedTo: input.assignTo,
      assignedBy: input.userId,
      correlationId: input.correlationId,
    },
  });

  return ok(assignment);
}

/**
 * B2: Resolve triage — move invoice from INCOMPLETE back to DRAFT or PENDING_APPROVAL.
 */
export async function resolveTriageInvoice(
  input: ResolveTriageInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    triageAssignmentRepo: ITriageAssignmentRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<ApInvoice>> {
  const found = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found;

  if (found.value.status !== 'INCOMPLETE') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Invoice must be INCOMPLETE to resolve, current: ${found.value.status}`
      )
    );
  }

  const updated = await deps.apInvoiceRepo.updateStatus(input.invoiceId, input.targetStatus);
  if (!updated.ok) return updated;

  await deps.triageAssignmentRepo.unassign(input.invoiceId);

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_TRIAGE_RESOLVED,
    payload: {
      invoiceId: input.invoiceId,
      targetStatus: input.targetStatus,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return updated;
}

/**
 * B2: List invoices in triage queue — all INCOMPLETE, optionally filtered by assignee.
 */
export async function listTriageQueue(
  input: TriageQueueQuery,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    triageAssignmentRepo?: ITriageAssignmentRepo;
  }
): Promise<Result<readonly ApInvoice[]>> {
  const result = await deps.apInvoiceRepo.findByStatus('INCOMPLETE');
  let invoices = result.data;

  if (input.assignedTo && deps.triageAssignmentRepo) {
    const assignments = await deps.triageAssignmentRepo.findByAssignee(
      input.tenantId,
      input.assignedTo
    );
    const assignedIds = new Set(assignments.map((a) => a.invoiceId));
    invoices = invoices.filter((inv) => assignedIds.has(inv.id));
  }

  return ok(invoices);
}
