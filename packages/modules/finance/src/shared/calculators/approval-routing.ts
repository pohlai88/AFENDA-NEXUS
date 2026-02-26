/**
 * GAP-A2: Pure calculator — approval routing.
 *
 * Given policies + metadata, determine which approval chain applies (first-match).
 * No I/O, no DB — pure function.
 */
import type {
  ApprovalPolicy,
  ApprovalChainStep,
  ConditionOperator,
} from '../entities/approval-policy.js';

/**
 * Evaluate a single condition against metadata.
 * Values are compared as numbers when possible, otherwise as strings.
 */
function evaluateCondition(
  field: string,
  operator: ConditionOperator,
  threshold: string,
  metadata: Record<string, unknown>
): boolean {
  const raw = metadata[field];
  if (raw === undefined || raw === null) return false;

  const metaNum = Number(raw);
  const threshNum = Number(threshold);
  const bothNumeric = !isNaN(metaNum) && !isNaN(threshNum);

  if (bothNumeric) {
    switch (operator) {
      case 'gt':
        return metaNum > threshNum;
      case 'gte':
        return metaNum >= threshNum;
      case 'lt':
        return metaNum < threshNum;
      case 'lte':
        return metaNum <= threshNum;
      case 'eq':
        return metaNum === threshNum;
    }
  }

  // String comparison fallback
  const metaStr = String(raw);
  switch (operator) {
    case 'gt':
      return metaStr > threshold;
    case 'gte':
      return metaStr >= threshold;
    case 'lt':
      return metaStr < threshold;
    case 'lte':
      return metaStr <= threshold;
    case 'eq':
      return metaStr === threshold;
  }
}

/**
 * Routes an approval request to the appropriate chain based on policies.
 *
 * Policies are evaluated in array order. Within each policy, rules are
 * evaluated in order (first-match). Returns the chain from the first
 * matching rule, or null if no policy/rule matches (approval not required).
 */
export function routeApproval(
  policies: readonly ApprovalPolicy[],
  entityType: string,
  metadata: Record<string, unknown>
): readonly ApprovalChainStep[] | null {
  // Filter to active policies matching this entity type
  const applicable = policies.filter((p) => p.isActive && p.entityType === entityType);

  if (applicable.length === 0) return null;

  for (const policy of applicable) {
    for (const rule of policy.rules) {
      const { field, operator, value } = rule.condition;
      if (evaluateCondition(field, operator, value, metadata)) {
        return rule.chain;
      }
    }
  }

  // No rule matched — approval not required
  return null;
}
