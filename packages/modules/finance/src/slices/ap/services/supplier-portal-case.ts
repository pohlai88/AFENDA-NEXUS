/**
 * Phase 1.1.1: Supplier Case Management service.
 *
 * Cases generalise disputes with 8-status lifecycle, SLA timers,
 * unified timeline, and proof-chain integration.
 *
 * Uses kernel SP-4001 (case state machine), SP-4003 (SLA calculator),
 * SP-1008 (ticket number generator), and SP-1006 (proof chain).
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import {
  isValidCaseTransition,
  computeSlaDeadline,
  getSlaConfig,
  type CaseStatus,
  type CaseCategory,
  type CasePriority,
} from '@afenda/supplier-kernel/domain';
import type { IProofChainWriter, ProofEventType } from '@afenda/supplier-kernel';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

// ─── Domain Types ───────────────────────────────────────────────────────────

export interface SupplierCase {
  readonly id: string;
  readonly tenantId: string;
  readonly ticketNumber: string;
  readonly supplierId: string;
  readonly category: CaseCategory;
  readonly priority: CasePriority;
  readonly subject: string;
  readonly description: string;
  readonly status: CaseStatus;
  readonly assignedTo: string | null;
  readonly coAssignees: readonly string[];
  readonly linkedEntityId: string | null;
  readonly linkedEntityType: string | null;
  readonly slaDeadline: Date | null;
  readonly resolution: string | null;
  readonly rootCause: string | null;
  readonly correctiveAction: string | null;
  readonly resolvedBy: string | null;
  readonly resolvedAt: Date | null;
  readonly escalationId: string | null;
  readonly proofChainHead: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type TimelineEntryType =
  | 'status'
  | 'message'
  | 'attachment'
  | 'escalation'
  | 'sla_breach'
  | 'payment'
  | 'match'
  | 'system';

export interface CaseTimelineEntry {
  readonly id: string;
  readonly caseId: string;
  readonly tenantId: string;
  readonly entryType: TimelineEntryType;
  readonly refId: string | null;
  readonly refType: string | null;
  readonly actorId: string;
  readonly actorType: 'SUPPLIER' | 'BUYER' | 'SYSTEM';
  readonly content: Record<string, unknown> | null;
  readonly proofHash: string | null;
  readonly createdAt: Date;
}

// ─── Repository Port ────────────────────────────────────────────────────────

export interface ISupplierCaseRepo {
  create(caseData: SupplierCase): Promise<SupplierCase>;
  findById(id: string): Promise<SupplierCase | null>;
  findBySupplierId(
    supplierId: string,
    query: CaseListQuery
  ): Promise<{ items: readonly SupplierCase[]; total: number }>;
  updateStatus(
    id: string,
    status: CaseStatus,
    resolution?: string,
    resolvedBy?: string
  ): Promise<SupplierCase | null>;
  update(id: string, data: Partial<SupplierCase>): Promise<SupplierCase | null>;
  nextTicketSequence(tenantId: string): Promise<number>;
}

export interface ICaseTimelineRepo {
  append(entry: CaseTimelineEntry): Promise<CaseTimelineEntry>;
  findByCaseId(
    caseId: string,
    query: { page: number; limit: number; entryType?: TimelineEntryType }
  ): Promise<{ items: readonly CaseTimelineEntry[]; total: number }>;
}

// ─── Input DTOs ─────────────────────────────────────────────────────────────

export interface CreateCaseInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly category: CaseCategory;
  readonly priority: CasePriority;
  readonly subject: string;
  readonly description: string;
  readonly linkedEntityType?: string;
  readonly linkedEntityId?: string;
  readonly idempotencyKey?: string;
}

export interface CaseListQuery {
  readonly page: number;
  readonly limit: number;
  readonly status?: CaseStatus;
  readonly category?: CaseCategory;
  readonly priority?: CasePriority;
  readonly search?: string;
}

export interface TransitionCaseInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly caseId: string;
  readonly targetStatus: CaseStatus;
  readonly comment?: string;
}

export interface AssignCaseInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly caseId: string;
  readonly assignedTo: string;
  readonly coAssignees?: readonly string[];
  readonly comment?: string;
}

export interface AddTimelineMessageInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly caseId: string;
  readonly content: string;
  readonly actorType: 'SUPPLIER' | 'BUYER' | 'SYSTEM';
}

// ─── Service Functions ──────────────────────────────────────────────────────

interface CaseServiceDeps {
  readonly supplierRepo: ISupplierRepo;
  readonly supplierCaseRepo: ISupplierCaseRepo;
  readonly caseTimelineRepo: ICaseTimelineRepo;
  readonly outboxWriter: IOutboxWriter;
  /**
   * Optional during Phase 1.1.1 scaffold — will be required once
   * infrastructure adapter is wired (Phase 1.1/1.2).
   * V2 DoD L4: "Proof-chain entry for supplier-facing events."
   */
  readonly proofChainWriter?: IProofChainWriter;
}

/**
 * Write a proof chain entry if the writer is wired.
 * No-ops gracefully when proof chain infrastructure is not yet available.
 */
async function writeProofEntry(
  deps: Pick<CaseServiceDeps, 'proofChainWriter'>,
  eventType: ProofEventType,
  entityId: string,
  actorId: string,
  actorType: 'SUPPLIER' | 'BUYER' | 'SYSTEM',
  eventAt: Date,
  payload: Record<string, unknown>
): Promise<string | null> {
  if (!deps.proofChainWriter) return null;
  const entry = await deps.proofChainWriter.write(
    {
      eventId: crypto.randomUUID(),
      eventType,
      entityType: 'case',
      entityId,
      actorType,
      actorId,
      eventAt,
      payload,
      previousHash: null, // Writer resolves from DB
    },
    undefined // tx will be provided when called within transaction boundary
  );
  return entry.contentHash;
}

/**
 * Generate a tenant-scoped ticket number: CASE-{TENANT_PREFIX}-{YYYY}-{SEQ}
 * Delegates sequence generation to the repo (DB sequence or MAX+1).
 */
function buildTicketNumber(tenantPrefix: string, year: number, seq: number): string {
  return `CASE-${tenantPrefix}-${year}-${String(seq).padStart(5, '0')}`;
}

export async function supplierCreateCase(
  input: CreateCaseInput,
  deps: CaseServiceDeps
): Promise<Result<SupplierCase>> {
  // Validate supplier exists and is active
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.status === 'INACTIVE') {
    return err(new AppError('VALIDATION', 'Supplier is inactive'));
  }

  // Validate required fields
  if (!input.subject || input.subject.trim().length < 5) {
    return err(new AppError('VALIDATION', 'Case subject must be at least 5 characters'));
  }
  if (!input.description || input.description.trim().length < 10) {
    return err(new AppError('VALIDATION', 'Case description must be at least 10 characters'));
  }

  // Generate ticket number
  const now = new Date();
  const seq = await deps.supplierCaseRepo.nextTicketSequence(input.tenantId);
  // Use first 3 chars of tenantId as prefix (will be replaced by tenant short code in production)
  const tenantPrefix = input.tenantId.slice(0, 3).toUpperCase();
  const ticketNumber = buildTicketNumber(tenantPrefix, now.getFullYear(), seq);

  // Compute SLA deadline using kernel SP-4003
  const slaConfig = getSlaConfig(input.priority, input.category);
  const slaDeadline = computeSlaDeadline(now, slaConfig.resolutionHours);

  const newCase: SupplierCase = {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    ticketNumber,
    supplierId: input.supplierId,
    category: input.category,
    priority: input.priority,
    subject: input.subject.trim(),
    description: input.description.trim(),
    status: 'SUBMITTED',
    assignedTo: null,
    coAssignees: [],
    linkedEntityId: input.linkedEntityId ?? null,
    linkedEntityType: input.linkedEntityType ?? null,
    slaDeadline,
    resolution: null,
    rootCause: null,
    correctiveAction: null,
    resolvedBy: null,
    resolvedAt: null,
    escalationId: null,
    proofChainHead: null,
    createdBy: input.userId,
    createdAt: now,
    updatedAt: now,
  };

  const created = await deps.supplierCaseRepo.create(newCase);

  // Write proof chain entry (V2 DoD L4: every status change → proof chain entry)
  const proofHash = await writeProofEntry(
    deps,
    'CASE_CREATED',
    created.id,
    input.userId,
    'SUPPLIER',
    now,
    {
      ticketNumber: created.ticketNumber,
      category: input.category,
      priority: input.priority,
      subject: input.subject,
    }
  );

  // Append initial timeline entry
  await deps.caseTimelineRepo.append({
    id: crypto.randomUUID(),
    caseId: created.id,
    tenantId: input.tenantId,
    entryType: 'status',
    refId: null,
    refType: null,
    actorId: input.userId,
    actorType: 'SUPPLIER',
    content: {
      fromStatus: null,
      toStatus: 'SUBMITTED',
      description: `Case created: ${input.subject}`,
    },
    proofHash,
    createdAt: now,
  });

  // Emit outbox event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_CASE_CREATED,
    payload: {
      caseId: created.id,
      ticketNumber: created.ticketNumber,
      supplierId: input.supplierId,
      category: input.category,
      priority: input.priority,
      subject: input.subject,
      userId: input.userId,
    },
  });

  return ok(created);
}

export async function supplierGetCase(
  input: { tenantId: string; supplierId: string; caseId: string },
  deps: Pick<CaseServiceDeps, 'supplierCaseRepo'>
): Promise<Result<SupplierCase>> {
  const found = await deps.supplierCaseRepo.findById(input.caseId);
  if (!found) {
    return err(new AppError('NOT_FOUND', 'Case not found'));
  }
  if (found.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Case does not belong to this supplier'));
  }
  return ok(found);
}

export async function supplierListCases(
  input: { tenantId: string; supplierId: string; query: CaseListQuery },
  deps: Pick<CaseServiceDeps, 'supplierRepo' | 'supplierCaseRepo'>
): Promise<Result<{ items: readonly SupplierCase[]; total: number }>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  const result = await deps.supplierCaseRepo.findBySupplierId(input.supplierId, input.query);
  return ok(result);
}

export async function supplierTransitionCase(
  input: TransitionCaseInput,
  deps: CaseServiceDeps
): Promise<Result<SupplierCase>> {
  const found = await deps.supplierCaseRepo.findById(input.caseId);
  if (!found) {
    return err(new AppError('NOT_FOUND', 'Case not found'));
  }
  if (found.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Case does not belong to this supplier'));
  }

  // Validate transition using kernel SP-4001
  if (!isValidCaseTransition(found.status, input.targetStatus)) {
    return err(
      new AppError(
        'VALIDATION',
        `Invalid status transition: ${found.status} → ${input.targetStatus}`
      )
    );
  }

  const now = new Date();
  const updateData: Partial<SupplierCase> = {
    status: input.targetStatus,
    updatedAt: now,
    // If resolving, stamp resolved fields
    ...(input.targetStatus === 'RESOLVED' || input.targetStatus === 'CLOSED'
      ? { resolvedBy: input.userId, resolvedAt: now }
      : {}),
  };

  const updated = await deps.supplierCaseRepo.update(input.caseId, updateData);
  if (!updated) {
    return err(new AppError('NOT_FOUND', 'Case not found after update'));
  }

  // Write proof chain entry for status change
  const proofHash = await writeProofEntry(
    deps,
    'CASE_STATUS_CHANGED',
    input.caseId,
    input.userId,
    'BUYER',
    now,
    {
      fromStatus: found.status,
      toStatus: input.targetStatus,
      comment: input.comment ?? null,
    }
  );

  // Append timeline entry for status change
  await deps.caseTimelineRepo.append({
    id: crypto.randomUUID(),
    caseId: input.caseId,
    tenantId: input.tenantId,
    entryType: 'status',
    refId: null,
    refType: null,
    actorId: input.userId,
    actorType: 'BUYER', // Status transitions typically done by buyer-side
    content: {
      fromStatus: found.status,
      toStatus: input.targetStatus,
      comment: input.comment ?? null,
    },
    proofHash,
    createdAt: now,
  });

  // Emit event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_CASE_STATUS_CHANGED,
    payload: {
      caseId: input.caseId,
      ticketNumber: found.ticketNumber,
      supplierId: input.supplierId,
      fromStatus: found.status,
      toStatus: input.targetStatus,
      userId: input.userId,
    },
  });

  return ok(updated);
}

export async function supplierAssignCase(
  input: AssignCaseInput,
  deps: CaseServiceDeps
): Promise<Result<SupplierCase>> {
  const found = await deps.supplierCaseRepo.findById(input.caseId);
  if (!found) {
    return err(new AppError('NOT_FOUND', 'Case not found'));
  }
  if (found.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Case does not belong to this supplier'));
  }

  const now = new Date();
  const updated = await deps.supplierCaseRepo.update(input.caseId, {
    assignedTo: input.assignedTo,
    coAssignees: input.coAssignees ?? [],
    status: found.status === 'SUBMITTED' ? 'ASSIGNED' : found.status,
    updatedAt: now,
  });
  if (!updated) {
    return err(new AppError('NOT_FOUND', 'Case not found after update'));
  }

  // Write proof chain entry for assignment
  const proofHash = await writeProofEntry(
    deps,
    'CASE_ASSIGNED',
    input.caseId,
    input.userId,
    'BUYER',
    now,
    {
      assignedTo: input.assignedTo,
      coAssignees: input.coAssignees ?? [],
      comment: input.comment ?? null,
    }
  );

  // Append timeline entry
  await deps.caseTimelineRepo.append({
    id: crypto.randomUUID(),
    caseId: input.caseId,
    tenantId: input.tenantId,
    entryType: 'system',
    refId: null,
    refType: null,
    actorId: input.userId,
    actorType: 'BUYER',
    content: {
      action: 'case_assigned',
      assignedTo: input.assignedTo,
      coAssignees: input.coAssignees ?? [],
      comment: input.comment ?? null,
    },
    proofHash,
    createdAt: now,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_CASE_ASSIGNED,
    payload: {
      caseId: input.caseId,
      ticketNumber: found.ticketNumber,
      supplierId: input.supplierId,
      assignedTo: input.assignedTo,
      userId: input.userId,
    },
  });

  return ok(updated);
}

export async function supplierAddTimelineMessage(
  input: AddTimelineMessageInput,
  deps: Pick<
    CaseServiceDeps,
    'supplierCaseRepo' | 'caseTimelineRepo' | 'outboxWriter' | 'proofChainWriter'
  >
): Promise<Result<CaseTimelineEntry>> {
  const found = await deps.supplierCaseRepo.findById(input.caseId);
  if (!found) {
    return err(new AppError('NOT_FOUND', 'Case not found'));
  }
  if (found.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Case does not belong to this supplier'));
  }
  if (found.status === 'CLOSED') {
    return err(new AppError('VALIDATION', 'Cannot add messages to a closed case'));
  }

  const now = new Date();

  // Write proof chain entry for message
  const proofHash = await writeProofEntry(
    deps,
    'MESSAGE_SENT',
    input.caseId,
    input.userId,
    input.actorType,
    now,
    { caseId: input.caseId, contentLength: input.content.length }
  );

  const entry: CaseTimelineEntry = {
    id: crypto.randomUUID(),
    caseId: input.caseId,
    tenantId: input.tenantId,
    entryType: 'message',
    refId: null,
    refType: null,
    actorId: input.userId,
    actorType: input.actorType,
    content: {
      message: input.content,
    },
    proofHash,
    createdAt: now,
  };

  const appended = await deps.caseTimelineRepo.append(entry);

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_CASE_TIMELINE_ENTRY,
    payload: {
      caseId: input.caseId,
      timelineEntryId: appended.id,
      entryType: 'message',
      actorId: input.userId,
      actorType: input.actorType,
    },
  });

  return ok(appended);
}

export async function supplierGetCaseTimeline(
  input: {
    tenantId: string;
    supplierId: string;
    caseId: string;
    page: number;
    limit: number;
    entryType?: TimelineEntryType;
  },
  deps: Pick<CaseServiceDeps, 'supplierCaseRepo' | 'caseTimelineRepo'>
): Promise<Result<{ items: readonly CaseTimelineEntry[]; total: number }>> {
  const found = await deps.supplierCaseRepo.findById(input.caseId);
  if (!found) {
    return err(new AppError('NOT_FOUND', 'Case not found'));
  }
  if (found.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Case does not belong to this supplier'));
  }

  const result = await deps.caseTimelineRepo.findByCaseId(input.caseId, {
    page: input.page,
    limit: input.limit,
    entryType: input.entryType,
  });

  return ok(result);
}
