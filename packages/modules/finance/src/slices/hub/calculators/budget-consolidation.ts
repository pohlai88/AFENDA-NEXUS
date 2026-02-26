/**
 * BG-04: Budget consolidation calculator.
 * Aggregates budgets from multiple cost centers or companies into
 * a consolidated budget, with optional elimination of inter-unit items.
 * Pure calculator — no DB, no side effects.
 */

import type { CalculatorResult } from '../../../shared/types.js';

export interface BudgetSourceLine {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface EliminationRule {
  readonly accountCode: string;
  readonly sourceId: string;
  readonly counterpartSourceId: string;
}

export interface BudgetConsolidationInput {
  readonly sources: readonly BudgetSourceLine[];
  readonly eliminations: readonly EliminationRule[];
  readonly targetCurrencyCode: string;
}

export interface ConsolidatedLine {
  readonly accountCode: string;
  readonly accountName: string;
  readonly grossAmount: bigint;
  readonly eliminationAmount: bigint;
  readonly netAmount: bigint;
  readonly sourceCount: number;
}

export interface BudgetConsolidationResult {
  readonly lines: readonly ConsolidatedLine[];
  readonly totalGross: bigint;
  readonly totalEliminations: bigint;
  readonly totalNet: bigint;
  readonly sourceCount: number;
  readonly targetCurrencyCode: string;
}

/**
 * Consolidate budgets from multiple sources.
 */
export function computeBudgetConsolidation(
  input: BudgetConsolidationInput
): CalculatorResult<BudgetConsolidationResult> {
  if (input.sources.length === 0) throw new Error('At least one budget source is required');

  // Aggregate by account
  const byAccount = new Map<
    string,
    {
      accountName: string;
      grossAmount: bigint;
      sourceIds: Set<string>;
    }
  >();

  for (const src of input.sources) {
    const existing = byAccount.get(src.accountCode) ?? {
      accountName: src.accountName,
      grossAmount: 0n,
      sourceIds: new Set<string>(),
    };
    existing.grossAmount += src.amount;
    existing.sourceIds.add(src.sourceId);
    byAccount.set(src.accountCode, existing);
  }

  // Build elimination map: accountCode → total elimination amount
  const elimMap = new Map<string, bigint>();
  for (const rule of input.eliminations) {
    // Find matching source lines for the elimination pair
    const sourceLines = input.sources.filter(
      (s) => s.accountCode === rule.accountCode && s.sourceId === rule.sourceId
    );
    const counterLines = input.sources.filter(
      (s) => s.accountCode === rule.accountCode && s.sourceId === rule.counterpartSourceId
    );

    if (sourceLines.length > 0 && counterLines.length > 0) {
      const sourceTotal = sourceLines.reduce((sum, l) => sum + l.amount, 0n);
      const counterTotal = counterLines.reduce((sum, l) => sum + l.amount, 0n);
      // Eliminate the smaller of the two (full netting)
      const elimAmount = sourceTotal < counterTotal ? sourceTotal : counterTotal;
      const existing = elimMap.get(rule.accountCode) ?? 0n;
      elimMap.set(rule.accountCode, existing + elimAmount);
    }
  }

  const lines: ConsolidatedLine[] = [];
  let totalGross = 0n;
  let totalEliminations = 0n;
  let totalNet = 0n;
  const allSourceIds = new Set<string>();

  for (const [accountCode, data] of byAccount) {
    const eliminationAmount = elimMap.get(accountCode) ?? 0n;
    const netAmount = data.grossAmount - eliminationAmount;

    lines.push({
      accountCode,
      accountName: data.accountName,
      grossAmount: data.grossAmount,
      eliminationAmount,
      netAmount,
      sourceCount: data.sourceIds.size,
    });

    totalGross += data.grossAmount;
    totalEliminations += eliminationAmount;
    totalNet += netAmount;
    for (const id of data.sourceIds) allSourceIds.add(id);
  }

  return {
    result: {
      lines,
      totalGross,
      totalEliminations,
      totalNet,
      sourceCount: allSourceIds.size,
      targetCurrencyCode: input.targetCurrencyCode,
    },
    inputs: { sourceLineCount: input.sources.length, eliminationCount: input.eliminations.length },
    explanation: `Budget consolidation: ${lines.length} accounts from ${allSourceIds.size} sources, eliminations=${totalEliminations}`,
  };
}
