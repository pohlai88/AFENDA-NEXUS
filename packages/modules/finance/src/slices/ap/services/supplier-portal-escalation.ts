/**
 * Phase 1.2.2: Breakglass Escalation service (CAP-SOS P19).
 *
 * Design rules:
 *   - Only ONE active (non-resolved) escalation per (tenant, case) pair.
 *   - Auto-assign: round-robin from `isEscalationContact=true` directory entries.
 *   - SLA clocks computed at trigger time (immutable): 48h respond, 5 days resolve.
 *   - Proof chain writes: ESCALATION_TRIGGERED on create, ESCALATION_RESOLVED on resolve.
 *   - Requires `ESCALATE` permission (not available to PORTAL_READONLY).
 *
 * Status lifecycle:
 *   ESCALATION_REQUESTED -> ESCALATION_ASSIGNED -> ESCALATION_IN_PROGRESS -> ESCALATION_RESOLVED
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError, NotFoundError } from '@afenda/core';
import type { IProofChainWriter, ProofEventType } from '@afenda/supplier-kernel';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import type { ISupplierCaseRepo } from './supplier-portal-case.js';
import type { IDirectoryRepo } from './supplier-portal-directory.js';

// Domain Types

export type EscalationStatus =
  | 'ESCALATION_REQUESTED'
  | 'ESCALATION_ASSIGNED'
  | 'ESCALATION_IN_PROGRESS'
  | 'ESCALATION_RESOLVED';

export interface EscalationEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly caseId: string;
  readonly supplierId: string;
  readonly triggeredBy: string;
  readonly assignedTo: string | null;
  readonly assignedAt: Date | null;
  readonly status: EscalationStatus;
  readonly reason: string;
  readonly respondByAt: Date;
  readonly resolveByAt: Date;
  readonly resolvedAt: Date | null;
  readonly resolutionNotes: string | null;
  readonly proofHash: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface EscalationSla {
  readonly respondByAt: Date;
  readonly resolveByAt: Date;
  readonly respondSlaBreached: boolean;
  readonly resolveSlaBreached: boolean;
  readonly hoursUntilRespond: number;
  readonly hoursUntilResolve: number;
}

export interface EscalationDetail extends EscalationEntity {
  readonly sla: EscalationSla;
}

// Repository Port

export interface EscalationListQuery {
  readonly page: number;
  readonly limit: number;
  readonly status?: EscalationStatus;
  readonly caseId?: string;
}

export interface IEscalationRepo {
  create(data: EscalationEntity): Promise<EscalationEntity>;
  findById(tenantId: string, id: string): Promise<EscalationEntity | null>;
  findActiveByCaseId(tenantId: string, caseId: string): Promise<EscalationEntity | null>;
  list(
    tenantId: string,
    supplierId: string,
    query: EscalationListQuery
  ): Promise<{ items: readonly EscalationEntity[]; total: number }>;
  updateStatus(
    id: string,
    status: EscalationStatus,
    patch?: Partial<
      Pick<
        EscalationEntity,
        'assignedTo' | 'assignedAt' | 'resolvedAt' | 'resolutionNotes' | 'proofHash'
      >
    >
  ): Promise<EscalationEntity | null>;
}

// Service Deps

export interface EscalationServiceDeps {
  readonly escalationRepo: IEscalationRepo;
  readonly supplierCaseRepo: ISupplierCaseRepo;
  readonly directoryRepo: IDirectoryRepo;
  readonly outboxWriter: IOutboxWriter;
  readonly proofChainWriter?: IProofChainWriter;
}

// SLA Constants

const RESPOND_BY_MS = 48 * 60 * 60 * 1_000;
const RESOLVE_BY_MS = 5 * 24 * 60 * 60 * 1_000;

// Proof Chain Helper

async function writeProofEntry(
  writer: IProofChainWriter | undefined,
  input: {
    eventType: ProofEventType;
    entityId: string;
    entityType: string;
    actorId: string;
    actorType: 'SUPPLIER' | 'BUYER' | 'SYSTEM';
    payload?: Record<string, unknown>;
  }
): Promise<string | null> {
  if (!writer) return null;
  try {
    const result = await writer.write(
      {
        eventId: crypto.randomUUID(),
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        actorType: input.actorType,
        actorId: input.actorId,
        eventAt: new Date(),
        payload: input.payload ?? {},
        previousHash: null,
      },
      undefined
    );
    return result?.contentHash ?? null;
  } catch {
    return null;
  }
}

// SLA Calculator

function computeSla(respondByAt: Date, resolveByAt: Date, now = new Date()): EscalationSla {
  const msUntilRespond = respondByAt.getTime() - now.getTime();
  const msUntilResolve = resolveByAt.getTime() - now.getTime();
  return {
    respondByAt,
    resolveByAt,
    respondSlaBreached: msUntilRespond < 0,
    resolveSlaBreached: msUntilResolve < 0,
    hoursUntilRespond: Math.round(msUntilRespond / (60 * 60 * 1_000)),
    hoursUntilResolve: Math.round(msUntilResolve / (60 * 60 * 1_000)),
  };
}

// Trigger Escalation

export interface TriggerEscalationInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly triggeredBy: string;
  readonly caseId: string;
  readonly reason: string;
}

export async function triggerEscalation(
  input: TriggerEscalationInput,
  deps: EscalationServiceDeps
): Promise<Result<EscalationEntity, AppError>> {
  const { tenantId, supplierId, triggeredBy, caseId, reason } = input;
  const { escalationRepo, supplierCaseRepo, directoryRepo, outboxWriter, proofChainWriter } = deps;

  const supplierCase = await supplierCaseRepo.findById(caseId);
  if (!supplierCase || supplierCase.tenantId !== tenantId) {
    return err(new NotFoundError('Case', caseId));
  }
  if (supplierCase.supplierId !== supplierId) {
    return err(new AppError('FORBIDDEN', 'Case does not belong to this supplier'));
  }

  const existing = await escalationRepo.findActiveByCaseId(tenantId, caseId);
  if (existing) {
    return err(
      new AppError('ESCALATION_ALREADY_ACTIVE', 'An active escalation already exists for this case')
    );
  }

  const contacts = await directoryRepo.findByTenantId(tenantId, { escalationOnly: true });
  const assignedTo = contacts[0]?.id ?? null;

  const now = new Date();
  const respondByAt = new Date(now.getTime() + RESPOND_BY_MS);
  const resolveByAt = new Date(now.getTime() + RESOLVE_BY_MS);

  const proofHash = await writeProofEntry(proofChainWriter, {
    eventType: 'ESCALATION_TRIGGERED',
    actorId: triggeredBy,
    actorType: 'SUPPLIER',
    entityId: caseId,
    entityType: 'supplier_case',
    payload: { caseId, supplierId, reason, respondByAt: respondByAt.toISOString() },
  });

  const escalation: EscalationEntity = {
    id: crypto.randomUUID(),
    tenantId,
    caseId,
    supplierId,
    triggeredBy,
    assignedTo,
    assignedAt: assignedTo ? now : null,
    status: assignedTo ? 'ESCALATION_ASSIGNED' : 'ESCALATION_REQUESTED',
    reason,
    respondByAt,
    resolveByAt,
    resolvedAt: null,
    resolutionNotes: null,
    proofHash,
    createdAt: now,
    updatedAt: now,
  };

  const created = await escalationRepo.create(escalation);

  await outboxWriter.write({
    tenantId,
    eventType: assignedTo
      ? FinanceEventType.SUPPLIER_ESCALATION_ASSIGNED
      : FinanceEventType.SUPPLIER_ESCALATION_TRIGGERED,
    payload: {
      escalationId: created.id,
      caseId,
      supplierId,
      assignedTo,
      respondByAt: respondByAt.toISOString(),
      resolveByAt: resolveByAt.toISOString(),
    },
  });

  return ok(created);
}

// List Escalations

export interface ListEscalationsInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly page: number;
  readonly limit: number;
  readonly status?: EscalationStatus;
  readonly caseId?: string;
}

export interface EscalationListResult {
  readonly items: readonly EscalationEntity[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

export async function listEscalations(
  input: ListEscalationsInput,
  deps: Pick<EscalationServiceDeps, 'escalationRepo'>
): Promise<Result<EscalationListResult, AppError>> {
  const { tenantId, supplierId, page, limit, status, caseId } = input;
  const result = await deps.escalationRepo.list(tenantId, supplierId, {
    page,
    limit,
    status,
    caseId,
  });
  return ok({
    items: result.items,
    total: result.total,
    page,
    limit,
    hasMore: page * limit < result.total,
  });
}

// Get Escalation (with SLA countdown)

export interface GetEscalationInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly escalationId: string;
}

export async function getEscalation(
  input: GetEscalationInput,
  deps: Pick<EscalationServiceDeps, 'escalationRepo'>
): Promise<Result<EscalationDetail, AppError>> {
  const { tenantId, supplierId, escalationId } = input;
  const escalation = await deps.escalationRepo.findById(tenantId, escalationId);

  if (!escalation) {
    return err(new NotFoundError('Escalation', escalationId));
  }
  if (escalation.supplierId !== supplierId) {
    return err(new AppError('FORBIDDEN', 'Escalation does not belong to this supplier'));
  }

  const sla = computeSla(escalation.respondByAt, escalation.resolveByAt);
  return ok({ ...escalation, sla });
}

// Resolve Escalation

export interface ResolveEscalationInput {
  readonly tenantId: string;
  readonly resolvedBy: string;
  readonly escalationId: string;
  readonly resolutionNotes: string;
}

export async function resolveEscalation(
  input: ResolveEscalationInput,
  deps: EscalationServiceDeps
): Promise<Result<EscalationEntity, AppError>> {
  const { tenantId, resolvedBy, escalationId, resolutionNotes } = input;
  const { escalationRepo, outboxWriter, proofChainWriter } = deps;

  const escalation = await escalationRepo.findById(tenantId, escalationId);
  if (!escalation) {
    return err(new NotFoundError('Escalation', escalationId));
  }
  if (escalation.status === 'ESCALATION_RESOLVED') {
    return err(new AppError('ALREADY_RESOLVED', 'Escalation is already resolved', 409));
  }

  const now = new Date();

  const proofHash = await writeProofEntry(proofChainWriter, {
    eventType: 'ESCALATION_RESOLVED',
    actorId: resolvedBy,
    actorType: 'BUYER',
    entityId: escalationId,
    entityType: 'supplier_escalation',
    payload: {
      caseId: escalation.caseId,
      supplierId: escalation.supplierId,
      resolutionNotes,
    },
  });

  const updated = await escalationRepo.updateStatus(escalationId, 'ESCALATION_RESOLVED', {
    resolvedAt: now,
    resolutionNotes,
    proofHash,
  });

  if (!updated) {
    return err(new AppError('UPDATE_FAILED', 'Failed to update escalation status', 500));
  }

  await outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.SUPPLIER_ESCALATION_RESOLVED,
    payload: {
      escalationId,
      caseId: escalation.caseId,
      supplierId: escalation.supplierId,
      resolvedBy,
    },
  });

  return ok(updated);
}
