/**
 * FI-03: Fair value hierarchy (Level 1/2/3) — IFRS 13.
 * Pure calculator — assigns fair value levels and computes
 * unrealized gain/loss for fair value instruments.
 */
import type { CalculatorResult } from "../../../shared/types.js";
import type { FairValueLevel, InstrumentClassification } from "../entities/financial-instrument.js";

export interface FairValueInput {
  readonly instrumentId: string;
  readonly classification: InstrumentClassification;
  readonly carryingAmount: bigint;
  readonly newFairValue: bigint;
  readonly fairValueLevel: FairValueLevel;
  readonly currencyCode: string;
}

export interface FairValueResult {
  readonly instrumentId: string;
  readonly unrealizedGainLoss: bigint;
  readonly isGain: boolean;
  readonly newCarryingAmount: bigint;
  readonly recognizedInPnl: bigint;
  readonly recognizedInOci: bigint;
  readonly fairValueLevel: FairValueLevel;
}

/**
 * Fair value measurement:
 * - FVTPL: gain/loss in P&L
 * - FVOCI: gain/loss in OCI
 * - Amortized Cost: no fair value adjustment (carrying amount unchanged)
 */
export function computeFairValue(
  inputs: readonly FairValueInput[],
): CalculatorResult<readonly FairValueResult[]> {
  if (inputs.length === 0) {
    throw new Error("At least one instrument required");
  }

  const results: FairValueResult[] = inputs.map((input) => {
    if (input.classification === "AMORTIZED_COST") {
      return {
        instrumentId: input.instrumentId,
        unrealizedGainLoss: 0n,
        isGain: false,
        newCarryingAmount: input.carryingAmount,
        recognizedInPnl: 0n,
        recognizedInOci: 0n,
        fairValueLevel: input.fairValueLevel,
      };
    }

    const unrealizedGainLoss = input.newFairValue - input.carryingAmount;
    const isGain = unrealizedGainLoss > 0n;

    return {
      instrumentId: input.instrumentId,
      unrealizedGainLoss,
      isGain,
      newCarryingAmount: input.newFairValue,
      recognizedInPnl: input.classification === "FVTPL" ? unrealizedGainLoss : 0n,
      recognizedInOci: input.classification === "FVOCI" ? unrealizedGainLoss : 0n,
      fairValueLevel: input.fairValueLevel,
    };
  });

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Fair value: ${results.filter((r) => r.unrealizedGainLoss !== 0n).length}/${inputs.length} with adjustments`,
  };
}
