/**
 * SLA-02/SLA-05: Mapping rule entity with version lifecycle.
 * Maps accounting events to journal templates.
 * Lifecycle: DRAFT → PUBLISHED → DEPRECATED
 */

export type MappingRuleStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

export interface MappingRuleCondition {
  readonly field: string;
  readonly operator: 'EQ' | 'NEQ' | 'IN' | 'NOT_IN' | 'GT' | 'LT' | 'GTE' | 'LTE';
  readonly value: string | readonly string[];
}

export interface MappingRuleTarget {
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly percentageBps: number;
  readonly memo: string;
}

export interface MappingRule {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly version: number;
  readonly eventType: string;
  readonly conditions: readonly MappingRuleCondition[];
  readonly targets: readonly MappingRuleTarget[];
  readonly targetLedgerIds: readonly string[];
  readonly priority: number;
  readonly status: MappingRuleStatus;
  readonly publishedAt: Date | null;
  readonly deprecatedAt: Date | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
