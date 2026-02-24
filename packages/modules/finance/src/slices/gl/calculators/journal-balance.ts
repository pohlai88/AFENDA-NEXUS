/**
 * @see DE-01 — Double-entry enforcement: every debit has equal credit
 * @see DE-10 — Integer minor units for all monetary amounts (no floating point)
 *
 * Pure calculator — no I/O, no side effects.
 * Validates that a set of journal lines is balanced (sum debits = sum credits).
 */
import type { Money } from "@afenda/core";

export type { CalculatorResult } from "../../../shared/types.js";
import type { CalculatorResult } from "../../../shared/types.js";

export interface JournalBalanceLine {
  readonly debit: Money;
  readonly credit: Money;
}

export interface JournalBalanceResult {
  readonly totalDebits: bigint;
  readonly totalCredits: bigint;
  readonly balanced: boolean;
}

export function validateJournalBalance(
  lines: readonly JournalBalanceLine[],
): CalculatorResult<JournalBalanceResult> {
  if (lines.length < 2) {
    throw new Error("Journal must have at least 2 lines");
  }

  let totalDebits = 0n;
  let totalCredits = 0n;

  for (const line of lines) {
    if (line.debit.amount < 0n) {
      throw new Error(`Debit amount must be non-negative, got ${line.debit.amount}`);
    }
    if (line.credit.amount < 0n) {
      throw new Error(`Credit amount must be non-negative, got ${line.credit.amount}`);
    }
    totalDebits += line.debit.amount;
    totalCredits += line.credit.amount;
  }

  const balanced = totalDebits === totalCredits;

  return {
    result: { totalDebits, totalCredits, balanced },
    inputs: { lineCount: lines.length },
    explanation: balanced
      ? `Journal balanced: DR ${totalDebits} = CR ${totalCredits} across ${lines.length} lines`
      : `Journal UNBALANCED: DR ${totalDebits} ≠ CR ${totalCredits}`,
  };
}
