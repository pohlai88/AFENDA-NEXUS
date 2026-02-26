/**
 * GAP-A2: Approval policy repository port.
 *
 * Defines the contract for persisting and querying approval policies.
 */
import type { Result } from '@afenda/core';
import type { ApprovalPolicy, ApprovalRule } from '../entities/approval-policy.js';

export interface CreateApprovalPolicyInput {
  readonly tenantId: string;
  readonly companyId?: string | null;
  readonly entityType: string;
  readonly name: string;
  readonly rules: readonly ApprovalRule[];
}

export interface IApprovalPolicyRepo {
  create(input: CreateApprovalPolicyInput): Promise<Result<ApprovalPolicy>>;
  findById(id: string): Promise<Result<ApprovalPolicy>>;
  findByTenantAndEntityType(tenantId: string, entityType: string): Promise<ApprovalPolicy[]>;
  update(
    id: string,
    input: Partial<Pick<ApprovalPolicy, 'name' | 'isActive' | 'rules'>>,
    bumpVersion?: boolean
  ): Promise<Result<ApprovalPolicy>>;
  deactivate(id: string): Promise<Result<void>>;
}
