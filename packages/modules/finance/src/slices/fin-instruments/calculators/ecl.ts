/**
 * FI-04: Expected Credit Loss (ECL) model — IFRS 9.5.5.
 * Pure calculator — computes 12-month and lifetime ECL
 * using probability of default, loss given default, and exposure at default.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export type EclStage = "STAGE_1" | "STAGE_2" | "STAGE_3";

export interface EclInput {
  readonly instrumentId: string;
  readonly stage: EclStage;
  readonly exposureAtDefault: bigint;
  readonly probabilityOfDefaultBps: number;
  readonly lossGivenDefaultBps: number;
  readonly remainingLifeMonths: number;
  readonly existingProvision: bigint;
  readonly currencyCode: string;
}

export interface EclResult {
  readonly instrumentId: string;
  readonly stage: EclStage;
  readonly eclAmount: bigint;
  readonly provisionChange: bigint;
  readonly isIncrease: boolean;
  readonly newProvision: bigint;
}

/**
 * ECL computation:
 * Stage 1: 12-month ECL = EAD × PD(12m) × LGD
 * Stage 2/3: Lifetime ECL = EAD × PD(lifetime) × LGD
 * Lifetime PD is approximated as: min(PD_12m × remaining_months / 12, 10000 bps)
 */
export function computeEcl(
  inputs: readonly EclInput[],
): CalculatorResult<readonly EclResult[]> {
  if (inputs.length === 0) {
    throw new Error("At least one instrument required");
  }

  const results: EclResult[] = inputs.map((input) => {
    let eclAmount: bigint;

    if (input.stage === "STAGE_1") {
      // 12-month ECL = EAD × PD_12m × LGD (bps × bps / 10000^2)
      eclAmount =
        (input.exposureAtDefault *
          BigInt(input.probabilityOfDefaultBps) *
          BigInt(input.lossGivenDefaultBps)) /
        (10000n * 10000n);
    } else {
      // Lifetime PD ≈ PD_12m × remainingMonths / 12, capped at 10000 bps
      // All integer arithmetic: PD_lifetime_bps = PD_12m * months / 12
      const lifetimePdBps =
        (BigInt(input.probabilityOfDefaultBps) * BigInt(input.remainingLifeMonths)) / 12n;
      const cappedPdBps = lifetimePdBps > 10000n ? 10000n : lifetimePdBps;
      eclAmount =
        (input.exposureAtDefault * cappedPdBps * BigInt(input.lossGivenDefaultBps)) /
        (10000n * 10000n);
    }

    const provisionChange = eclAmount - input.existingProvision;

    return {
      instrumentId: input.instrumentId,
      stage: input.stage,
      eclAmount,
      provisionChange,
      isIncrease: provisionChange > 0n,
      newProvision: eclAmount,
    };
  });

  const totalEcl = results.reduce((s, r) => s + r.eclAmount, 0n);

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `ECL: ${results.length} instruments, total ECL=${totalEcl}, stages: S1=${results.filter((r) => r.stage === "STAGE_1").length} S2=${results.filter((r) => r.stage === "STAGE_2").length} S3=${results.filter((r) => r.stage === "STAGE_3").length}`,
  };
}
