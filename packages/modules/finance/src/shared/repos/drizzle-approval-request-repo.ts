/**
 * GAP-A2: Drizzle implementation of IApprovalRequestRepo.
 *
 * Writes to erp.approval_request and erp.approval_step.
 */
import { eq, and } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { approvalRequests, approvalSteps } from '@afenda/db';
import type {
  ApprovalRequest,
  ApprovalStep,
  ApprovalRequestStatus,
  ApprovalStepStatus,
} from '../entities/approval-request.js';
import type {
  IApprovalRequestRepo,
  CreateApprovalRequestInput,
  CreateApprovalStepInput,
} from '../ports/approval-request-repo.js';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result } from '@afenda/core';

function mapStep(r: typeof approvalSteps.$inferSelect): ApprovalStep {
  return {
    id: r.id!,
    requestId: r.requestId,
    stepIndex: r.stepIndex,
    approverId: r.approverId,
    status: r.status as ApprovalStepStatus,
    decidedAt: r.decidedAt,
    reason: r.reason,
    delegatedTo: r.delegatedTo,
  };
}

async function loadRequest(
  tx: TenantTx,
  row: typeof approvalRequests.$inferSelect
): Promise<ApprovalRequest> {
  const stepRows = await tx
    .select()
    .from(approvalSteps)
    .where(eq(approvalSteps.requestId, row.id!))
    .orderBy(approvalSteps.stepIndex);

  return {
    id: row.id!,
    tenantId: row.tenantId,
    entityType: row.entityType,
    entityId: row.entityId,
    requestedBy: row.requestedBy,
    requestedAt: row.requestedAt,
    status: row.status as ApprovalRequestStatus,
    currentStepIndex: row.currentStepIndex,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    completedAt: row.completedAt,
    steps: stepRows.map(mapStep),
  };
}

export class DrizzleApprovalRequestRepo implements IApprovalRequestRepo {
  constructor(private readonly tx: TenantTx) {}

  async createRequest(input: CreateApprovalRequestInput): Promise<Result<ApprovalRequest>> {
    const [row] = await this.tx
      .insert(approvalRequests)
      .values({
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        requestedBy: input.requestedBy,
        metadata: input.metadata as Record<string, unknown>,
      })
      .returning();
    if (!row) return err(new NotFoundError('ApprovalRequest', 'insert-failed'));
    return ok(await loadRequest(this.tx, row));
  }

  async createSteps(
    steps: readonly CreateApprovalStepInput[]
  ): Promise<Result<readonly ApprovalStep[]>> {
    if (steps.length === 0) return ok([]);
    const rows = await this.tx
      .insert(approvalSteps)
      .values(
        steps.map((s) => ({
          requestId: s.requestId,
          stepIndex: s.stepIndex,
          approverId: s.approverId,
        }))
      )
      .returning();
    return ok(rows.map(mapStep));
  }

  async findById(id: string): Promise<Result<ApprovalRequest>> {
    const rows = await this.tx.select().from(approvalRequests).where(eq(approvalRequests.id, id));
    if (rows.length === 0) return err(new NotFoundError('ApprovalRequest', id));
    return ok(await loadRequest(this.tx, rows[0]!));
  }

  async findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<Result<ApprovalRequest>> {
    const rows = await this.tx
      .select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.tenantId, tenantId),
          eq(approvalRequests.entityType, entityType),
          eq(approvalRequests.entityId, entityId)
        )
      );
    if (rows.length === 0)
      return err(new NotFoundError('ApprovalRequest', `${entityType}:${entityId}`));
    return ok(await loadRequest(this.tx, rows[0]!));
  }

  async findPendingForApprover(
    tenantId: string,
    approverId: string
  ): Promise<Result<readonly ApprovalRequest[]>> {
    // Find step rows for this approver that are PENDING
    const pendingStepRows = await this.tx
      .select()
      .from(approvalSteps)
      .where(and(eq(approvalSteps.approverId, approverId), eq(approvalSteps.status, 'PENDING')));

    if (pendingStepRows.length === 0) return ok([]);

    const requestIds = [...new Set(pendingStepRows.map((s) => s.requestId))];
    const results: ApprovalRequest[] = [];

    for (const reqId of requestIds) {
      const reqRows = await this.tx
        .select()
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.id, reqId),
            eq(approvalRequests.tenantId, tenantId),
            eq(approvalRequests.status, 'PENDING')
          )
        );
      if (reqRows.length > 0) {
        results.push(await loadRequest(this.tx, reqRows[0]!));
      }
    }

    return ok(results);
  }

  async updateRequestStatus(
    id: string,
    status: ApprovalRequestStatus,
    currentStepIndex?: number
  ): Promise<Result<ApprovalRequest>> {
    const values: Record<string, unknown> = { status };
    if (currentStepIndex !== undefined) values.currentStepIndex = currentStepIndex;
    if (status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED') {
      values.completedAt = new Date();
    }

    const [row] = await this.tx
      .update(approvalRequests)
      .set(values)
      .where(eq(approvalRequests.id, id))
      .returning();
    if (!row) return err(new NotFoundError('ApprovalRequest', id));
    return ok(await loadRequest(this.tx, row));
  }

  async updateStepStatus(
    stepId: string,
    status: ApprovalStepStatus,
    reason?: string | null,
    delegatedTo?: string | null
  ): Promise<Result<ApprovalStep>> {
    const values: Record<string, unknown> = { status, decidedAt: new Date() };
    if (reason !== undefined) values.reason = reason;
    if (delegatedTo !== undefined) values.delegatedTo = delegatedTo;

    const [row] = await this.tx
      .update(approvalSteps)
      .set(values)
      .where(eq(approvalSteps.id, stepId))
      .returning();
    if (!row) return err(new NotFoundError('ApprovalStep', stepId));
    return ok(mapStep(row));
  }
}
