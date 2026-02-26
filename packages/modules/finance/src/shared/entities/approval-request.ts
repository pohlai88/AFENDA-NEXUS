/**
 * GAP-A2: Approval request domain entity.
 *
 * Pure type — no DB imports, no I/O.
 * Tracks one approval lifecycle for any entity type.
 */

export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';

export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'DELEGATED';

export interface ApprovalStep {
  readonly id: string;
  readonly requestId: string;
  readonly stepIndex: number;
  readonly approverId: string;
  readonly status: ApprovalStepStatus;
  readonly decidedAt: Date | null;
  readonly reason: string | null;
  readonly delegatedTo: string | null;
}

export interface ApprovalRequest {
  readonly id: string;
  readonly tenantId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly policyId: string | null;
  readonly policyVersion: number | null;
  readonly requestedBy: string;
  readonly requestedAt: Date;
  readonly status: ApprovalRequestStatus;
  readonly currentStepIndex: number;
  readonly metadata: Record<string, unknown>;
  readonly completedAt: Date | null;
  readonly steps: readonly ApprovalStep[];
}
