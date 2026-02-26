/**
 * @see AH-01 — Derivation engine: rule-based posting from source transactions
 * @see AH-02 — Allocation engine: cost/revenue distribution by driver
 * @see AH-03 — Reclassification: move balances between accounts
 *
 * Pure calculator — no I/O, no side effects.
 * Implements the accounting hub pattern: derives journal lines from
 * source transactions using configurable derivation rules.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type DerivationRuleType = 'posting' | 'allocation' | 'reclassification' | 'accrual';

export interface DerivationRule {
  readonly id: string;
  readonly name: string;
  readonly type: DerivationRuleType;
  readonly sourceAccountId: string;
  readonly targetAccountId: string;
  readonly percentage: number;
  readonly isActive: boolean;
  readonly priority: number;
}

export interface SourceTransaction {
  readonly transactionId: string;
  readonly accountId: string;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly description: string;
}

export interface DerivedLine {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly ruleType: DerivationRuleType;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly memo: string;
}

export interface DerivationResult {
  readonly derivedLines: readonly DerivedLine[];
  readonly unmatchedTransactions: readonly string[];
  readonly totalDerived: bigint;
}

const PRECISION_SCALE = 10000n;

/**
 * Applies derivation rules to source transactions.
 * Each matching rule produces a debit+credit line pair.
 * Rules are applied in priority order (lower number = higher priority).
 */
export function derivePostings(
  transactions: readonly SourceTransaction[],
  rules: readonly DerivationRule[]
): CalculatorResult<DerivationResult> {
  const activeRules = [...rules].filter((r) => r.isActive).sort((a, b) => a.priority - b.priority);

  const derivedLines: DerivedLine[] = [];
  const matchedTxIds = new Set<string>();
  let totalDerived = 0n;

  for (const tx of transactions) {
    const matchingRules = activeRules.filter((r) => r.sourceAccountId === tx.accountId);

    if (matchingRules.length === 0) continue;
    matchedTxIds.add(tx.transactionId);

    for (const rule of matchingRules) {
      if (rule.percentage <= 0 || rule.percentage > 100) {
        throw new Error(`Rule ${rule.id} has invalid percentage: ${rule.percentage}`);
      }

      // eslint-disable-next-line no-restricted-syntax -- percentage-to-BigInt, not FX
      const scaledPct = BigInt(Math.round(rule.percentage * 100));
      const amount = (tx.amountMinor * scaledPct) / PRECISION_SCALE;

      if (amount === 0n) continue;

      totalDerived += amount;
      derivedLines.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.type,
        debitAccountId: rule.targetAccountId,
        creditAccountId: rule.sourceAccountId,
        amountMinor: amount,
        currency: tx.currency,
        memo: `${rule.type}: ${rule.name} — ${tx.description}`,
      });
    }
  }

  const unmatchedTransactions = transactions
    .filter((tx) => !matchedTxIds.has(tx.transactionId))
    .map((tx) => tx.transactionId);

  return {
    result: { derivedLines, unmatchedTransactions, totalDerived },
    inputs: { transactionCount: transactions.length, ruleCount: rules.length },
    explanation: `Derivation: ${derivedLines.length} lines from ${matchedTxIds.size}/${transactions.length} transactions, ${unmatchedTransactions.length} unmatched`,
  };
}

export interface AllocationDriver {
  readonly targetAccountId: string;
  readonly weight: number;
}

export interface AllocationResult {
  readonly allocations: readonly {
    readonly targetAccountId: string;
    readonly amountMinor: bigint;
    readonly percentage: number;
  }[];
  readonly remainder: bigint;
}

/**
 * Allocates an amount across target accounts by driver weights.
 * Uses largest-remainder method to ensure exact distribution with no rounding loss.
 */
export function allocateByDriver(
  totalMinor: bigint,
  drivers: readonly AllocationDriver[],
  currency: string
): CalculatorResult<AllocationResult> {
  if (totalMinor <= 0n) {
    throw new Error(`Total must be positive, got ${totalMinor}`);
  }
  if (drivers.length === 0) {
    throw new Error('At least one allocation driver required');
  }

  const totalWeight = drivers.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }

  // First pass: floor allocation
  const allocations = drivers.map((d) => {
    const pct = d.weight / totalWeight;
    // eslint-disable-next-line no-restricted-syntax -- allocation arithmetic, not FX
    const exact = Number(totalMinor) * pct;
    const floored = BigInt(Math.floor(exact));
    return {
      targetAccountId: d.targetAccountId,
      amountMinor: floored,
      // eslint-disable-next-line no-restricted-syntax -- display percentage, not FX
      percentage: Math.round(pct * 10000) / 100,
      fractional: exact - Math.floor(exact),
    };
  });

  // Second pass: distribute remainder by largest fractional part
  const allocated = allocations.reduce((sum, a) => sum + a.amountMinor, 0n);
  let remainder = totalMinor - allocated;

  const sorted = allocations
    .map((a, i) => ({ index: i, fractional: a.fractional }))
    .sort((a, b) => b.fractional - a.fractional);

  for (const item of sorted) {
    if (remainder <= 0n) break;
    allocations[item.index]!.amountMinor += 1n;
    remainder -= 1n;
  }

  return {
    result: {
      allocations: allocations.map(({ fractional: _, ...rest }) => rest),
      remainder: 0n,
    },
    inputs: { totalMinor: totalMinor.toString(), driverCount: drivers.length, currency },
    explanation: `Allocated ${totalMinor} ${currency} across ${drivers.length} targets, zero remainder`,
  };
}
