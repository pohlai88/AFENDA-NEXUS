/**
 * FA-05: Revaluation model (fair value → OCI).
 * Computes revaluation surplus/deficit for an asset.
 * Pure calculator — no DB, no side effects.
 * Uses raw bigint for amounts (minor units).
 */

export interface RevaluationInput {
  readonly assetId: string;
  readonly currentNbv: bigint;
  readonly fairValue: bigint;
  readonly previousRevaluationSurplus: bigint;
  readonly currencyCode: string;
}

export type RevaluationEffect =
  | 'SURPLUS_TO_OCI'
  | 'DEFICIT_TO_PL'
  | 'DEFICIT_REVERSAL_FROM_OCI'
  | 'NO_CHANGE';

export interface RevaluationResult {
  readonly assetId: string;
  readonly effect: RevaluationEffect;
  readonly revaluationAmount: bigint;
  readonly newNbv: bigint;
  readonly ociImpact: bigint;
  readonly plImpact: bigint;
  readonly newRevaluationSurplus: bigint;
}

/**
 * Compute revaluation adjustment per IAS 16.
 *
 * Surplus: fair value > NBV → credit OCI (revaluation surplus)
 * Deficit: fair value < NBV →
 *   - First offset against existing surplus in OCI
 *   - Remainder → P&L expense
 */
export function computeRevaluation(input: RevaluationInput): RevaluationResult {
  const diff = input.fairValue - input.currentNbv;

  if (diff === 0n) {
    return {
      assetId: input.assetId,
      effect: 'NO_CHANGE',
      revaluationAmount: 0n,
      newNbv: input.currentNbv,
      ociImpact: 0n,
      plImpact: 0n,
      newRevaluationSurplus: input.previousRevaluationSurplus,
    };
  }

  if (diff > 0n) {
    // Surplus → OCI
    return {
      assetId: input.assetId,
      effect: 'SURPLUS_TO_OCI',
      revaluationAmount: diff,
      newNbv: input.fairValue,
      ociImpact: diff,
      plImpact: 0n,
      newRevaluationSurplus: input.previousRevaluationSurplus + diff,
    };
  }

  // Deficit
  const absDiff = -diff;
  if (input.previousRevaluationSurplus >= absDiff) {
    // Fully offset against OCI surplus
    return {
      assetId: input.assetId,
      effect: 'DEFICIT_REVERSAL_FROM_OCI',
      revaluationAmount: diff,
      newNbv: input.fairValue,
      ociImpact: diff,
      plImpact: 0n,
      newRevaluationSurplus: input.previousRevaluationSurplus - absDiff,
    };
  }

  // Partially offset against OCI, remainder to P&L
  const ociOffset = input.previousRevaluationSurplus;
  const plExpense = absDiff - ociOffset;
  return {
    assetId: input.assetId,
    effect: 'DEFICIT_TO_PL',
    revaluationAmount: diff,
    newNbv: input.fairValue,
    ociImpact: -ociOffset,
    plImpact: -plExpense,
    newRevaluationSurplus: 0n,
  };
}
