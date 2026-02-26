/**
 * FA-02: Depreciation methods (SL, DB, UoP).
 * Pure calculator — no DB, no side effects.
 * Uses raw bigint for amounts (minor units).
 * All rates are integer basis points — no float arithmetic on money.
 */

import type { DepreciationMethod } from '../entities/asset.js';

export interface DepreciationInput {
  readonly assetId: string;
  readonly acquisitionCost: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number;
  readonly depreciationMethod: DepreciationMethod;
  readonly accumulatedDepreciation: bigint;
  readonly periodMonths: number;
  /** For declining balance: rate in basis points (e.g. 2000 = 20%). */
  readonly decliningRateBps?: number;
  /** For units of production: total estimated units and units this period. */
  readonly totalEstimatedUnits?: number;
  readonly unitsThisPeriod?: number;
}

export interface DepreciationResult {
  readonly assetId: string;
  readonly method: DepreciationMethod;
  readonly depreciationAmount: bigint;
  readonly newAccumulatedDepreciation: bigint;
  readonly newNetBookValue: bigint;
  readonly isFullyDepreciated: boolean;
}

/**
 * Compute periodic depreciation for an asset.
 */
export function computeDepreciation(input: DepreciationInput): DepreciationResult {
  const depreciableAmount = input.acquisitionCost - input.residualValue;
  const currentNbv = input.acquisitionCost - input.accumulatedDepreciation;
  let depreciationAmount: bigint;

  switch (input.depreciationMethod) {
    case 'STRAIGHT_LINE':
      depreciationAmount = computeStraightLine(
        depreciableAmount,
        input.usefulLifeMonths,
        input.periodMonths
      );
      break;
    case 'DECLINING_BALANCE':
      depreciationAmount = computeDecliningBalance(
        currentNbv,
        input.residualValue,
        input.decliningRateBps ?? 2000,
        input.periodMonths
      );
      break;
    case 'UNITS_OF_PRODUCTION':
      depreciationAmount = computeUnitsOfProduction(
        depreciableAmount,
        input.totalEstimatedUnits ?? 1,
        input.unitsThisPeriod ?? 0
      );
      break;
  }

  // Cap depreciation so NBV doesn't go below residual value
  const maxDepreciation = currentNbv - input.residualValue;
  if (maxDepreciation <= 0n) {
    depreciationAmount = 0n;
  } else if (depreciationAmount > maxDepreciation) {
    depreciationAmount = maxDepreciation;
  }

  const newAccumulatedDepreciation = input.accumulatedDepreciation + depreciationAmount;
  const newNetBookValue = input.acquisitionCost - newAccumulatedDepreciation;

  return {
    assetId: input.assetId,
    method: input.depreciationMethod,
    depreciationAmount,
    newAccumulatedDepreciation,
    newNetBookValue,
    isFullyDepreciated: newNetBookValue <= input.residualValue,
  };
}

function computeStraightLine(
  depreciableAmount: bigint,
  usefulLifeMonths: number,
  periodMonths: number
): bigint {
  if (usefulLifeMonths <= 0) return 0n;
  return (depreciableAmount * BigInt(periodMonths)) / BigInt(usefulLifeMonths);
}

function computeDecliningBalance(
  currentNbv: bigint,
  residualValue: bigint,
  rateBps: number,
  periodMonths: number
): bigint {
  // Annual rate applied proportionally to period
  const annualDepr = (currentNbv * BigInt(rateBps)) / 10000n;
  const periodDepr = (annualDepr * BigInt(periodMonths)) / 12n;
  // Don't depreciate below residual
  const maxDepr = currentNbv - residualValue;
  return periodDepr > maxDepr ? maxDepr : periodDepr;
}

function computeUnitsOfProduction(
  depreciableAmount: bigint,
  totalUnits: number,
  unitsThisPeriod: number
): bigint {
  if (totalUnits <= 0) return 0n;
  return (depreciableAmount * BigInt(unitsThisPeriod)) / BigInt(totalUnits);
}

/**
 * Batch compute depreciation for multiple assets.
 */
export function computeBatchDepreciation(
  inputs: readonly DepreciationInput[]
): readonly DepreciationResult[] {
  return inputs.map(computeDepreciation);
}
