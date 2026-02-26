/**
 * DT-03: Tax rate change impact calculator — IAS 12.
 * Pure calculator — recomputes deferred tax balances when enacted
 * tax rates change, producing the P&L or OCI adjustment.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface RateChangeInput {
  readonly itemId: string;
  readonly temporaryDifference: bigint;
  readonly oldTaxRateBps: number;
  readonly newTaxRateBps: number;
  readonly isRecognizedInOci: boolean;
  readonly currencyCode: string;
}

export interface RateChangeResult {
  readonly itemId: string;
  readonly oldDeferredTax: bigint;
  readonly newDeferredTax: bigint;
  readonly adjustmentAmount: bigint;
  readonly recognizedInPnl: bigint;
  readonly recognizedInOci: bigint;
}

export interface RateChangeSummary {
  readonly items: readonly RateChangeResult[];
  readonly totalPnlImpact: bigint;
  readonly totalOciImpact: bigint;
}

/**
 * Rate change impact:
 * Adjustment = tempDiff × (newRate - oldRate)
 * Recognized in same component as original (P&L or OCI).
 */
export function computeRateChangeImpact(
  inputs: readonly RateChangeInput[]
): CalculatorResult<RateChangeSummary> {
  if (inputs.length === 0) {
    throw new Error('At least one item required');
  }

  let totalPnlImpact = 0n;
  let totalOciImpact = 0n;

  const items: RateChangeResult[] = inputs.map((input) => {
    const absDiff =
      input.temporaryDifference < 0n ? -input.temporaryDifference : input.temporaryDifference;
    const oldDt = (absDiff * BigInt(input.oldTaxRateBps)) / 10000n;
    const newDt = (absDiff * BigInt(input.newTaxRateBps)) / 10000n;
    const adjustment = newDt - oldDt;

    const pnl = input.isRecognizedInOci ? 0n : adjustment;
    const oci = input.isRecognizedInOci ? adjustment : 0n;

    totalPnlImpact += pnl;
    totalOciImpact += oci;

    return {
      itemId: input.itemId,
      oldDeferredTax: oldDt,
      newDeferredTax: newDt,
      adjustmentAmount: adjustment,
      recognizedInPnl: pnl,
      recognizedInOci: oci,
    };
  });

  return {
    result: { items, totalPnlImpact, totalOciImpact },
    inputs: { count: inputs.length },
    explanation: `Rate change: P&L impact=${totalPnlImpact}, OCI impact=${totalOciImpact}`,
  };
}
