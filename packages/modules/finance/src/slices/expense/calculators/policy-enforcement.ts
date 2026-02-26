/**
 * EM-03: Policy enforcement calculator.
 * Validates expense claim lines against company expense policies.
 * Pure calculator — no DB, no side effects.
 */

import type { ExpensePolicy } from '../entities/expense-policy.js';

export interface PolicyCheckLine {
  readonly lineNumber: number;
  readonly category: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly hasReceipt: boolean;
  readonly description: string;
}

export interface PolicyViolation {
  readonly lineNumber: number;
  readonly rule: string;
  readonly message: string;
  readonly severity: 'ERROR' | 'WARNING';
}

export interface PolicyCheckResult {
  readonly isCompliant: boolean;
  readonly violations: readonly PolicyViolation[];
  readonly totalAmount: bigint;
  readonly claimLimitExceeded: boolean;
}

/**
 * Check expense claim lines against applicable policies.
 */
export function enforceExpensePolicy(
  lines: readonly PolicyCheckLine[],
  policies: readonly ExpensePolicy[],
  claimCurrencyCode: string
): PolicyCheckResult {
  const violations: PolicyViolation[] = [];
  let totalAmount = 0n;

  for (const line of lines) {
    totalAmount += line.amount;
    const policy = policies.find((p) => p.category === line.category && p.isActive);
    if (!policy) continue;

    if (line.amount > policy.maxAmountPerItem) {
      violations.push({
        lineNumber: line.lineNumber,
        rule: 'MAX_AMOUNT_PER_ITEM',
        message: `Amount ${line.amount} exceeds max ${policy.maxAmountPerItem} for ${line.category}`,
        severity: 'ERROR',
      });
    }

    if (policy.requiresReceipt && !line.hasReceipt) {
      violations.push({
        lineNumber: line.lineNumber,
        rule: 'RECEIPT_REQUIRED',
        message: `Receipt required for ${line.category}`,
        severity: 'ERROR',
      });
    }
  }

  // Check total claim limit (use first matching policy's maxAmountPerClaim)
  const claimPolicy = policies.find((p) => p.isActive && p.currencyCode === claimCurrencyCode);
  const claimLimitExceeded = claimPolicy ? totalAmount > claimPolicy.maxAmountPerClaim : false;

  if (claimLimitExceeded && claimPolicy) {
    violations.push({
      lineNumber: 0,
      rule: 'MAX_AMOUNT_PER_CLAIM',
      message: `Total ${totalAmount} exceeds claim limit ${claimPolicy.maxAmountPerClaim}`,
      severity: 'ERROR',
    });
  }

  return {
    isCompliant: violations.filter((v) => v.severity === 'ERROR').length === 0,
    violations,
    totalAmount,
    claimLimitExceeded,
  };
}
