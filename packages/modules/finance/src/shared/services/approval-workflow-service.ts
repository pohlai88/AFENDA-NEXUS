/**
 * GAP-A2: Approval workflow service — implements IApprovalWorkflow.
 *
 * Orchestrates the approval lifecycle using the pure routing calculator,
 * policy repo, and request repo. Emits outbox events on state transitions.
 */
import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ApprovalRequest, ApprovalStep } from '../entities/approval-request.js';
import type { IApprovalWorkflow, SubmitApprovalInput } from '../ports/approval-workflow.js';
import type { IApprovalPolicyRepo } from '../ports/approval-policy-repo.js';
import type { IApprovalRequestRepo } from '../ports/approval-request-repo.js';
import type { IOutboxWriter } from '../ports/outbox-writer.js';
import { routeApproval } from '../calculators/approval-routing.js';
import { FinanceEventType } from '../events.js';

export class ApprovalWorkflowService implements IApprovalWorkflow {
  constructor(
    private readonly policyRepo: IApprovalPolicyRepo,
    private readonly requestRepo: IApprovalRequestRepo,
    private readonly outboxWriter: IOutboxWriter
  ) {}

  async submit(input: SubmitApprovalInput): Promise<Result<ApprovalRequest>> {
    // Load applicable policies
    const policies = await this.policyRepo.findByTenantAndEntityType(
      input.tenantId,
      input.entityType
    );

    // Route through pure calculator — W2-10: now returns policy snapshot info
    const route = routeApproval(policies, input.entityType, input.metadata);

    if (!route || route.chain.length === 0) {
      // No approval required — create an auto-approved request
      const reqResult = await this.requestRepo.createRequest(input);
      if (!reqResult.ok) return reqResult;

      const approved = await this.requestRepo.updateRequestStatus(reqResult.value.id, 'APPROVED');
      return approved;
    }

    // W2-10: Snapshot matched policy ID + version on the request
    const reqResult = await this.requestRepo.createRequest({
      ...input,
      policyId: route.policyId,
      policyVersion: route.policyVersion,
    });
    if (!reqResult.ok) return reqResult;

    // Create steps from chain
    const stepInputs = route.chain.map((chainStep, idx) => ({
      requestId: reqResult.value.id,
      stepIndex: idx,
      approverId: chainStep.approverValue,
    }));

    const stepsResult = await this.requestRepo.createSteps(stepInputs);
    if (!stepsResult.ok) return stepsResult as Result<never>;

    // Emit submission event
    await this.outboxWriter.write({
      tenantId: input.tenantId,
      eventType: FinanceEventType.APPROVAL_SUBMITTED,
      payload: {
        requestId: reqResult.value.id,
        entityType: input.entityType,
        entityId: input.entityId,
        requestedBy: input.requestedBy,
        stepsCount: route.chain.length,
      },
    });

    // Re-load with steps
    return this.requestRepo.findById(reqResult.value.id);
  }

  async approve(
    requestId: string,
    approverId: string,
    reason?: string
  ): Promise<Result<ApprovalRequest>> {
    const reqResult = await this.requestRepo.findById(requestId);
    if (!reqResult.ok) return reqResult;

    const request = reqResult.value;
    if (request.status !== 'PENDING') {
      return err(
        new AppError(
          'INVALID_STATE',
          `Approval request ${requestId} is ${request.status}, expected PENDING`
        )
      );
    }

    // Find the current pending step for this approver
    const currentStep = request.steps.find(
      (s) =>
        s.stepIndex === request.currentStepIndex &&
        s.status === 'PENDING' &&
        (s.approverId === approverId || s.delegatedTo === approverId)
    );

    if (!currentStep) {
      return err(
        new AppError(
          'FORBIDDEN',
          `User ${approverId} is not the current approver for request ${requestId}`
        )
      );
    }

    // Approve the step
    await this.requestRepo.updateStepStatus(currentStep.id, 'APPROVED', reason ?? null);

    // Check if there are more steps
    const nextStepIndex = request.currentStepIndex + 1;
    const hasMoreSteps = request.steps.some((s) => s.stepIndex === nextStepIndex);

    if (hasMoreSteps) {
      // Advance to next step
      const updated = await this.requestRepo.updateRequestStatus(
        requestId,
        'PENDING',
        nextStepIndex
      );

      return updated;
    }

    // All steps complete — mark as APPROVED
    const approved = await this.requestRepo.updateRequestStatus(requestId, 'APPROVED');
    if (!approved.ok) return approved;

    await this.outboxWriter.write({
      tenantId: request.tenantId,
      eventType: FinanceEventType.APPROVAL_APPROVED,
      payload: {
        requestId,
        entityType: request.entityType,
        entityId: request.entityId,
        approvedBy: approverId,
      },
    });

    return approved;
  }

  async reject(
    requestId: string,
    approverId: string,
    reason: string
  ): Promise<Result<ApprovalRequest>> {
    const reqResult = await this.requestRepo.findById(requestId);
    if (!reqResult.ok) return reqResult;

    const request = reqResult.value;
    if (request.status !== 'PENDING') {
      return err(
        new AppError(
          'INVALID_STATE',
          `Approval request ${requestId} is ${request.status}, expected PENDING`
        )
      );
    }

    // Find the current pending step for this approver
    const currentStep = request.steps.find(
      (s) =>
        s.stepIndex === request.currentStepIndex &&
        s.status === 'PENDING' &&
        (s.approverId === approverId || s.delegatedTo === approverId)
    );

    if (!currentStep) {
      return err(
        new AppError(
          'FORBIDDEN',
          `User ${approverId} is not the current approver for request ${requestId}`
        )
      );
    }

    // Reject the step
    await this.requestRepo.updateStepStatus(currentStep.id, 'REJECTED', reason);

    // Mark entire request as REJECTED
    const rejected = await this.requestRepo.updateRequestStatus(requestId, 'REJECTED');
    if (!rejected.ok) return rejected;

    await this.outboxWriter.write({
      tenantId: request.tenantId,
      eventType: FinanceEventType.APPROVAL_REJECTED,
      payload: {
        requestId,
        entityType: request.entityType,
        entityId: request.entityId,
        rejectedBy: approverId,
        reason,
      },
    });

    return rejected;
  }

  async delegate(
    requestId: string,
    approverId: string,
    delegateTo: string
  ): Promise<Result<ApprovalStep>> {
    const reqResult = await this.requestRepo.findById(requestId);
    if (!reqResult.ok) return reqResult as Result<never>;

    const request = reqResult.value;
    if (request.status !== 'PENDING') {
      return err(
        new AppError(
          'INVALID_STATE',
          `Approval request ${requestId} is ${request.status}, expected PENDING`
        )
      );
    }

    const currentStep = request.steps.find(
      (s) =>
        s.stepIndex === request.currentStepIndex &&
        s.status === 'PENDING' &&
        s.approverId === approverId
    );

    if (!currentStep) {
      return err(
        new AppError(
          'FORBIDDEN',
          `User ${approverId} is not the current approver for request ${requestId}`
        )
      );
    }

    return this.requestRepo.updateStepStatus(
      currentStep.id,
      'DELEGATED',
      `Delegated to ${delegateTo}`,
      delegateTo
    );
  }

  async cancel(requestId: string, requestedBy: string): Promise<Result<ApprovalRequest>> {
    const reqResult = await this.requestRepo.findById(requestId);
    if (!reqResult.ok) return reqResult;

    const request = reqResult.value;
    if (request.status !== 'PENDING') {
      return err(
        new AppError(
          'INVALID_STATE',
          `Approval request ${requestId} is ${request.status}, expected PENDING`
        )
      );
    }

    if (request.requestedBy !== requestedBy) {
      return err(
        new AppError('FORBIDDEN', `Only the requester can cancel approval request ${requestId}`)
      );
    }

    return this.requestRepo.updateRequestStatus(requestId, 'CANCELLED');
  }

  async findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<Result<ApprovalRequest>> {
    return this.requestRepo.findByEntity(tenantId, entityType, entityId);
  }

  async findPendingForApprover(
    tenantId: string,
    approverId: string
  ): Promise<Result<readonly ApprovalRequest[]>> {
    return this.requestRepo.findPendingForApprover(tenantId, approverId);
  }

  async isApproved(tenantId: string, entityType: string, entityId: string): Promise<boolean> {
    const result = await this.requestRepo.findByEntity(tenantId, entityType, entityId);
    if (!result.ok) return false;
    return result.value.status === 'APPROVED';
  }
}
