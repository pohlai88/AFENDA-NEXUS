/**
 * CO-05: Dividend elimination calculator.
 * Pure calculator — eliminates intra-group dividends declared by subsidiaries.
 * Parent's dividend income is reversed against subsidiary's retained earnings.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export interface DividendEliminationInput {
  readonly childEntityId: string;
  readonly parentEntityId: string;
  readonly parentOwnershipPctBps: number;
  readonly totalDividendDeclared: bigint;
  readonly currencyCode: string;
}

export interface DividendEliminationEntry {
  readonly childEntityId: string;
  readonly parentEntityId: string;
  readonly eliminationAmount: bigint;
  readonly nciShare: bigint;
  readonly currencyCode: string;
}

/**
 * Computes elimination of intra-group dividends.
 * Parent's share = totalDividend * parentOwnershipPctBps / 10000
 * NCI share = totalDividend - parent's share
 */
export function computeDividendEliminations(
  inputs: readonly DividendEliminationInput[],
): CalculatorResult<readonly DividendEliminationEntry[]> {
  if (inputs.length === 0) {
    return {
      result: [],
      inputs: { count: 0 },
      explanation: "No dividends to eliminate",
    };
  }

  const results: DividendEliminationEntry[] = [];

  for (const input of inputs) {
    if (input.totalDividendDeclared < 0n) {
      throw new Error(
        `Dividend must be non-negative for ${input.childEntityId}`,
      );
    }
    if (input.parentOwnershipPctBps < 0 || input.parentOwnershipPctBps > 10000) {
      throw new Error(
        `Invalid ownership BPS ${input.parentOwnershipPctBps} for ${input.childEntityId}`,
      );
    }

    const eliminationAmount =
      (input.totalDividendDeclared * BigInt(input.parentOwnershipPctBps)) / 10000n;
    const nciShare = input.totalDividendDeclared - eliminationAmount;

    results.push({
      childEntityId: input.childEntityId,
      parentEntityId: input.parentEntityId,
      eliminationAmount,
      nciShare,
      currencyCode: input.currencyCode,
    });
  }

  return {
    result: results,
    inputs: { dividendCount: inputs.length },
    explanation: `Dividend elimination: ${results.length} subsidiaries processed`,
  };
}
