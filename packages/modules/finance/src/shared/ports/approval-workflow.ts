/**
 * GAP-A2: Approval workflow port.
 *
 * Defines the contract for the multi-level approval engine.
 * Implementations manage lifecycle: submit → approve/reject/delegate/cancel.
 */
import type { Result } from '@afenda/core';
import type { ApprovalRequest, ApprovalStep } from '../entities/approval-request.js';

export interface SubmitApprovalInput {
  readonly tenantId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly requestedBy: string;
  readonly metadata: Record<string, unknown>;
}

export interface IApprovalWorkflow {
  /** Submit entity for approval — creates request + routes to chain */
  submit(input: SubmitApprovalInput): Promise<Result<ApprovalRequest>>;

  /** Approve current step */
  approve(requestId: string, approverId: string, reason?: string): Promise<Result<ApprovalRequest>>;

  /** Reject (terminates chain) */
  reject(requestId: string, approverId: string, reason: string): Promise<Result<ApprovalRequest>>;

  /** Delegate current step to another user */
  delegate(
    requestId: string,
    approverId: string,
    delegateTo: string
  ): Promise<Result<ApprovalStep>>;

  /** Cancel (by requester) */
  cancel(requestId: string, requestedBy: string): Promise<Result<ApprovalRequest>>;

  /** Find approval request by entity */
  findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<Result<ApprovalRequest>>;

  /** Find pending approvals for a specific approver */
  findPendingForApprover(
    tenantId: string,
    approverId: string
  ): Promise<Result<readonly ApprovalRequest[]>>;

  /** Check if entity is fully approved (terminal convenience) */
  isApproved(tenantId: string, entityType: string, entityId: string): Promise<boolean>;
}
