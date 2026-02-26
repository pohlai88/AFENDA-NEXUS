/**
 * GAP-A2: Approval policy domain entity.
 *
 * Pure type — no DB imports, no I/O.
 * Configurable rules per tenant/company for threshold-based routing.
 */

export type ConditionOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

export type ApproverType = 'role' | 'userId' | 'managerOf';

export type ChainMode = 'sequential' | 'parallel';

export interface ApprovalCondition {
  readonly field: string;
  readonly operator: ConditionOperator;
  readonly value: string;
}

export interface ApprovalChainStep {
  readonly approverType: ApproverType;
  readonly approverValue: string;
  readonly mode: ChainMode;
  readonly escalateAfterHours?: number;
}

export interface ApprovalRule {
  readonly condition: ApprovalCondition;
  readonly chain: readonly ApprovalChainStep[];
}

export interface ApprovalPolicy {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string | null;
  readonly entityType: string;
  readonly name: string;
  readonly version: number;
  readonly isActive: boolean;
  readonly rules: readonly ApprovalRule[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
