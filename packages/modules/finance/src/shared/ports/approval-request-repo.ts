/**
 * GAP-A2: Approval request repository port.
 *
 * Defines the contract for persisting and querying approval requests and steps.
 */
import type { Result } from '@afenda/core';
import type {
  ApprovalRequest,
  ApprovalStep,
  ApprovalRequestStatus,
  ApprovalStepStatus,
} from '../entities/approval-request.js';

export interface CreateApprovalRequestInput {
  readonly tenantId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly requestedBy: string;
  readonly metadata: Record<string, unknown>;
}

export interface CreateApprovalStepInput {
  readonly requestId: string;
  readonly stepIndex: number;
  readonly approverId: string;
}

export interface IApprovalRequestRepo {
  createRequest(input: CreateApprovalRequestInput): Promise<Result<ApprovalRequest>>;
  createSteps(steps: readonly CreateApprovalStepInput[]): Promise<Result<readonly ApprovalStep[]>>;

  findById(id: string): Promise<Result<ApprovalRequest>>;
  findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<Result<ApprovalRequest>>;
  findPendingForApprover(
    tenantId: string,
    approverId: string
  ): Promise<Result<readonly ApprovalRequest[]>>;

  updateRequestStatus(
    id: string,
    status: ApprovalRequestStatus,
    currentStepIndex?: number
  ): Promise<Result<ApprovalRequest>>;
  updateStepStatus(
    stepId: string,
    status: ApprovalStepStatus,
    reason?: string | null,
    delegatedTo?: string | null
  ): Promise<Result<ApprovalStep>>;
}
