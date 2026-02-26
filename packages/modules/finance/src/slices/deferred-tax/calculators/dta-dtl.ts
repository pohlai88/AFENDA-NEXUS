/**
 * DT-02: Deferred tax asset/liability computation — IAS 12.
 * Pure calculator — computes DTA and DTL from temporary differences
 * applying enacted/substantively enacted tax rates.
 */
import type { CalculatorResult } from '../../../shared/types.js';
import type { TempDiffType, TempDiffOrigin } from './temporary-differences.js';

export interface DtaInput {
  readonly itemId: string;
  readonly tempDiffType: TempDiffType;
  readonly origin: TempDiffOrigin;
  readonly absDifference: bigint;
  readonly taxRateBps: number;
  readonly isProbableTaxableProfit: boolean;
  readonly currencyCode: string;
}

export interface DtaResult {
  readonly itemId: string;
  readonly deferredTaxAsset: bigint;
  readonly deferredTaxLiability: bigint;
  readonly netDeferredTax: bigint;
  readonly isRecognized: boolean;
  readonly reason: string;
}

export interface DtaSummary {
  readonly items: readonly DtaResult[];
  readonly totalDta: bigint;
  readonly totalDtl: bigint;
  readonly netDeferredTax: bigint;
}

/**
 * DTA/DTL = temporary difference × tax rate
 * DTA from deductible differences: only recognized if probable future taxable profit.
 * DTL from taxable differences: always recognized (with limited exceptions).
 */
export function computeDtaDtl(inputs: readonly DtaInput[]): CalculatorResult<DtaSummary> {
  if (inputs.length === 0) {
    throw new Error('At least one temporary difference required');
  }

  let totalDta = 0n;
  let totalDtl = 0n;

  const items: DtaResult[] = inputs.map((input) => {
    const taxAmount = (input.absDifference * BigInt(input.taxRateBps)) / 10000n;

    if (input.tempDiffType === 'DEDUCTIBLE') {
      if (!input.isProbableTaxableProfit) {
        return {
          itemId: input.itemId,
          deferredTaxAsset: 0n,
          deferredTaxLiability: 0n,
          netDeferredTax: 0n,
          isRecognized: false,
          reason: 'DTA not recognized — insufficient probable taxable profit',
        };
      }
      totalDta += taxAmount;
      return {
        itemId: input.itemId,
        deferredTaxAsset: taxAmount,
        deferredTaxLiability: 0n,
        netDeferredTax: taxAmount,
        isRecognized: true,
        reason: 'DTA recognized — probable future taxable profit',
      };
    }

    // Taxable → DTL
    totalDtl += taxAmount;
    return {
      itemId: input.itemId,
      deferredTaxAsset: 0n,
      deferredTaxLiability: taxAmount,
      netDeferredTax: -taxAmount,
      isRecognized: true,
      reason: 'DTL recognized',
    };
  });

  return {
    result: {
      items,
      totalDta,
      totalDtl,
      netDeferredTax: totalDta - totalDtl,
    },
    inputs: { count: inputs.length },
    explanation: `Deferred tax: DTA=${totalDta}, DTL=${totalDtl}, net=${totalDta - totalDtl}`,
  };
}
