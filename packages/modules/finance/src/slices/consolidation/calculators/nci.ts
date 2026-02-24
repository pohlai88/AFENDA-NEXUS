/**
 * CO-02: Non-controlling interest (NCI) calculator.
 * Pure calculator — computes NCI share of subsidiary net assets and profit.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export interface NciInput {
  readonly childEntityId: string;
  readonly parentOwnershipPctBps: number;
  readonly subsidiaryNetAssets: bigint;
  readonly subsidiaryProfitOrLoss: bigint;
  readonly currencyCode: string;
}

export interface NciResult {
  readonly childEntityId: string;
  readonly nciPctBps: number;
  readonly nciNetAssets: bigint;
  readonly nciProfitOrLoss: bigint;
  readonly parentNetAssets: bigint;
  readonly parentProfitOrLoss: bigint;
  readonly currencyCode: string;
}

/**
 * Computes NCI share = (10000 - parentOwnershipPctBps) / 10000 of net assets and P&L.
 */
export function computeNci(
  inputs: readonly NciInput[],
): CalculatorResult<readonly NciResult[]> {
  if (inputs.length === 0) {
    throw new Error("At least one subsidiary required for NCI computation");
  }

  const results: NciResult[] = [];

  for (const input of inputs) {
    if (input.parentOwnershipPctBps < 0 || input.parentOwnershipPctBps > 10000) {
      throw new Error(
        `Invalid ownership BPS ${input.parentOwnershipPctBps} for ${input.childEntityId}`,
      );
    }

    const nciPctBps = 10000 - input.parentOwnershipPctBps;

    const nciNetAssets =
      (input.subsidiaryNetAssets * BigInt(nciPctBps)) / 10000n;
    const nciProfitOrLoss =
      (input.subsidiaryProfitOrLoss * BigInt(nciPctBps)) / 10000n;

    const parentNetAssets = input.subsidiaryNetAssets - nciNetAssets;
    const parentProfitOrLoss = input.subsidiaryProfitOrLoss - nciProfitOrLoss;

    results.push({
      childEntityId: input.childEntityId,
      nciPctBps,
      nciNetAssets,
      nciProfitOrLoss,
      parentNetAssets,
      parentProfitOrLoss,
      currencyCode: input.currencyCode,
    });
  }

  return {
    result: results,
    inputs: { subsidiaryCount: inputs.length },
    explanation: `NCI computed for ${results.length} subsidiaries`,
  };
}
