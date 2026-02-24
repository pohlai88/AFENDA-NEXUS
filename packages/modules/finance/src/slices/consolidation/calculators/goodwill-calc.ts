/**
 * CO-03: Goodwill on acquisition calculator (IFRS 3).
 * Pure calculator — computes goodwill = consideration − parent's share of fair-value net assets.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export interface GoodwillCalcInput {
  readonly childEntityId: string;
  readonly considerationPaid: bigint;
  readonly fairValueNetAssets: bigint;
  readonly parentOwnershipPctBps: number;
  readonly nciMeasurementMethod: "PROPORTIONATE" | "FULL_FAIR_VALUE";
  readonly nciFairValue: bigint;
  readonly currencyCode: string;
}

export interface GoodwillCalcResult {
  readonly childEntityId: string;
  readonly parentShareOfNetAssets: bigint;
  readonly nciAtAcquisition: bigint;
  readonly goodwillAmount: bigint;
  readonly isBargainPurchase: boolean;
  readonly currencyCode: string;
}

/**
 * IFRS 3 goodwill computation:
 * - Proportionate NCI method: goodwill = consideration − parent's share of FVNA
 * - Full fair-value NCI method: goodwill = (consideration + NCI fair value) − total FVNA
 */
export function computeGoodwill(
  inputs: readonly GoodwillCalcInput[],
): CalculatorResult<readonly GoodwillCalcResult[]> {
  if (inputs.length === 0) {
    throw new Error("At least one acquisition required");
  }

  const results: GoodwillCalcResult[] = [];

  for (const input of inputs) {
    if (input.considerationPaid < 0n) {
      throw new Error(`Consideration must be non-negative for ${input.childEntityId}`);
    }

    const parentShareOfNetAssets =
      (input.fairValueNetAssets * BigInt(input.parentOwnershipPctBps)) / 10000n;

    let goodwillAmount: bigint;
    let nciAtAcquisition: bigint;

    if (input.nciMeasurementMethod === "PROPORTIONATE") {
      nciAtAcquisition =
        (input.fairValueNetAssets * BigInt(10000 - input.parentOwnershipPctBps)) / 10000n;
      goodwillAmount = input.considerationPaid - parentShareOfNetAssets;
    } else {
      nciAtAcquisition = input.nciFairValue;
      goodwillAmount =
        input.considerationPaid + input.nciFairValue - input.fairValueNetAssets;
    }

    const isBargainPurchase = goodwillAmount < 0n;

    results.push({
      childEntityId: input.childEntityId,
      parentShareOfNetAssets,
      nciAtAcquisition,
      goodwillAmount,
      isBargainPurchase,
      currencyCode: input.currencyCode,
    });
  }

  return {
    result: results,
    inputs: { acquisitionCount: inputs.length },
    explanation: `Goodwill computed for ${results.length} acquisitions`,
  };
}
