/**
 * IA-02: Amortization calculator for intangible assets (IAS 38).
 * Reuses depreciation strategy pattern from FA-02.
 * Finite life → amortize. Indefinite life → no amortization (test for impairment).
 */
import type { CalculatorResult } from '../../../shared/types.js';
import type { AmortizationMethod, UsefulLifeType } from '../entities/intangible-asset.js';

export interface AmortizationInput {
  readonly assetId: string;
  readonly usefulLifeType: UsefulLifeType;
  readonly acquisitionCost: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number | null;
  readonly amortizationMethod: AmortizationMethod | null;
  readonly accumulatedAmortization: bigint;
  readonly periodMonths: number;
  readonly decliningRateBps?: number;
  readonly totalEstimatedUnits?: number;
  readonly unitsThisPeriod?: number;
}

export interface AmortizationResult {
  readonly assetId: string;
  readonly amortizationAmount: bigint;
  readonly newAccumulatedAmortization: bigint;
  readonly newNetBookValue: bigint;
  readonly isFullyAmortized: boolean;
  readonly requiresImpairmentTest: boolean;
}

/**
 * Compute periodic amortization for an intangible asset.
 * Indefinite-life assets: zero amortization, flagged for impairment test.
 */
export function computeAmortization(
  inputs: readonly AmortizationInput[]
): CalculatorResult<readonly AmortizationResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one intangible asset required');
  }

  const results: AmortizationResult[] = inputs.map((input) => {
    // Indefinite life — no amortization
    if (input.usefulLifeType === 'INDEFINITE') {
      const nbv = input.acquisitionCost - input.accumulatedAmortization;
      return {
        assetId: input.assetId,
        amortizationAmount: 0n,
        newAccumulatedAmortization: input.accumulatedAmortization,
        newNetBookValue: nbv,
        isFullyAmortized: false,
        requiresImpairmentTest: true,
      };
    }

    // Finite life — compute amortization
    const method = input.amortizationMethod ?? 'STRAIGHT_LINE';
    const usefulLifeMonths = input.usefulLifeMonths ?? 0;
    const depreciableAmount = input.acquisitionCost - input.residualValue;
    const currentNbv = input.acquisitionCost - input.accumulatedAmortization;
    let amortizationAmount: bigint;

    switch (method) {
      case 'STRAIGHT_LINE':
        amortizationAmount =
          usefulLifeMonths > 0
            ? (depreciableAmount * BigInt(input.periodMonths)) / BigInt(usefulLifeMonths)
            : 0n;
        break;
      case 'DECLINING_BALANCE': {
        const rateBps = input.decliningRateBps ?? 2000;
        const annualAmort = (currentNbv * BigInt(rateBps)) / 10000n;
        amortizationAmount = (annualAmort * BigInt(input.periodMonths)) / 12n;
        break;
      }
      case 'UNITS_OF_PRODUCTION': {
        const totalUnits = input.totalEstimatedUnits ?? 1;
        const unitsThisPeriod = input.unitsThisPeriod ?? 0;
        amortizationAmount =
          totalUnits > 0 ? (depreciableAmount * BigInt(unitsThisPeriod)) / BigInt(totalUnits) : 0n;
        break;
      }
    }

    // Cap so NBV doesn't go below residual
    const maxAmort = currentNbv - input.residualValue;
    if (maxAmort <= 0n) {
      amortizationAmount = 0n;
    } else if (amortizationAmount > maxAmort) {
      amortizationAmount = maxAmort;
    }

    const newAccum = input.accumulatedAmortization + amortizationAmount;
    const newNbv = input.acquisitionCost - newAccum;

    return {
      assetId: input.assetId,
      amortizationAmount,
      newAccumulatedAmortization: newAccum,
      newNetBookValue: newNbv,
      isFullyAmortized: newNbv <= input.residualValue,
      requiresImpairmentTest: false,
    };
  });

  const totalAmort = results.reduce((s, r) => s + r.amortizationAmount, 0n);

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Amortization: ${results.length} assets, total=${totalAmort}`,
  };
}
