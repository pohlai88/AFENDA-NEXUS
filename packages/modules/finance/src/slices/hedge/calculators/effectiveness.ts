/**
 * HA-02: Hedge effectiveness testing — IFRS 9 §6.4.1.
 * Pure calculator — tests hedge effectiveness using dollar-offset
 * and regression methods.
 */
import type { CalculatorResult } from '../../../shared/types.js';
import type { HedgeType } from '../entities/hedge-relationship.js';

export type EffectivenessMethod = 'DOLLAR_OFFSET' | 'REGRESSION';

export interface EffectivenessInput {
  readonly hedgeId: string;
  readonly hedgeType: HedgeType;
  readonly method: EffectivenessMethod;
  readonly hedgingInstrumentFvChange: bigint;
  readonly hedgedItemFvChange: bigint;
  readonly currencyCode: string;
  readonly regressionRSquared?: number;
  readonly regressionSlope?: number;
}

export interface EffectivenessResult {
  readonly hedgeId: string;
  readonly isEffective: boolean;
  readonly dollarOffsetRatioBps: number;
  readonly ineffectivenessAmount: bigint;
  readonly recycleToOci: bigint;
  readonly recycleToPnl: bigint;
  readonly reason: string;
}

/**
 * Dollar-offset: ratio = |instrument change / item change|
 * Effective if ratio in 80%–125% (8000–12500 bps).
 * Ineffectiveness = instrument change + item change (i.e. the mismatch).
 */
export function testEffectiveness(
  inputs: readonly EffectivenessInput[]
): CalculatorResult<readonly EffectivenessResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one hedge relationship required');
  }

  const results: EffectivenessResult[] = inputs.map((input) => {
    if (input.method === 'REGRESSION') {
      const rSquared = input.regressionRSquared ?? 0;
      const slope = input.regressionSlope ?? 0;
      const isEffective = rSquared >= 0.8 && slope >= -1.25 && slope <= -0.8;
      const ineffectivenessAmount = input.hedgingInstrumentFvChange + input.hedgedItemFvChange;

      return {
        hedgeId: input.hedgeId,
        isEffective,
        dollarOffsetRatioBps: 0,
        ineffectivenessAmount,
        recycleToOci: input.hedgeType === 'CASH_FLOW' ? input.hedgedItemFvChange : 0n,
        recycleToPnl: isEffective ? ineffectivenessAmount : input.hedgingInstrumentFvChange,
        reason: isEffective
          ? `Regression: R²=${rSquared}, slope=${slope} — effective`
          : `Regression: R²=${rSquared}, slope=${slope} — ineffective`,
      };
    }

    // Dollar-offset method
    if (input.hedgedItemFvChange === 0n) {
      return {
        hedgeId: input.hedgeId,
        isEffective: input.hedgingInstrumentFvChange === 0n,
        dollarOffsetRatioBps: input.hedgingInstrumentFvChange === 0n ? 10000 : 0,
        ineffectivenessAmount: input.hedgingInstrumentFvChange,
        recycleToOci: 0n,
        recycleToPnl: input.hedgingInstrumentFvChange,
        reason:
          input.hedgingInstrumentFvChange === 0n
            ? 'No change in either — effective'
            : 'Hedged item unchanged but instrument changed — ineffective',
      };
    }

    // Ratio in bps: |instrument / item| × 10000
    const absInstrument =
      input.hedgingInstrumentFvChange < 0n
        ? -input.hedgingInstrumentFvChange
        : input.hedgingInstrumentFvChange;
    const absItem =
      input.hedgedItemFvChange < 0n ? -input.hedgedItemFvChange : input.hedgedItemFvChange;

    const ratioBps = Number((absInstrument * 10000n) / absItem);
    const isEffective = ratioBps >= 8000 && ratioBps <= 12500;
    const ineffectivenessAmount = input.hedgingInstrumentFvChange + input.hedgedItemFvChange;

    return {
      hedgeId: input.hedgeId,
      isEffective,
      dollarOffsetRatioBps: ratioBps,
      ineffectivenessAmount,
      recycleToOci: input.hedgeType === 'CASH_FLOW' ? input.hedgedItemFvChange : 0n,
      recycleToPnl: isEffective ? ineffectivenessAmount : input.hedgingInstrumentFvChange,
      reason: isEffective
        ? `Dollar-offset ratio ${ratioBps} bps — within 80-125% band`
        : `Dollar-offset ratio ${ratioBps} bps — outside 80-125% band`,
    };
  });

  const effectiveCount = results.filter((r) => r.isEffective).length;

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Effectiveness: ${effectiveCount}/${inputs.length} hedges effective`,
  };
}
