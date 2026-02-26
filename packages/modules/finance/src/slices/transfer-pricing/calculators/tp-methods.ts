/**
 * TP-01: Transfer pricing methods — OECD Guidelines.
 * Pure calculator — validates intercompany transaction prices using
 * CUP, Resale Price, Cost Plus, TNMM, and Profit Split methods.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type TpMethod = 'CUP' | 'RESALE_PRICE' | 'COST_PLUS' | 'TNMM' | 'PROFIT_SPLIT';

export interface TpMethodInput {
  readonly transactionId: string;
  readonly method: TpMethod;
  readonly transactionPrice: bigint;
  readonly currencyCode: string;
  readonly benchmarkLowBps: number;
  readonly benchmarkMedianBps: number;
  readonly benchmarkHighBps: number;
  readonly costBase?: bigint;
  readonly revenueBase?: bigint;
  readonly netProfitBase?: bigint;
  readonly totalProfitPool?: bigint;
  readonly contributionFactorBps?: number;
}

export interface TpMethodResult {
  readonly transactionId: string;
  readonly method: TpMethod;
  readonly computedMarginBps: number;
  readonly isWithinRange: boolean;
  readonly adjustmentRequired: bigint;
  readonly armsLengthPriceLow: bigint;
  readonly armsLengthPriceMedian: bigint;
  readonly armsLengthPriceHigh: bigint;
  readonly reason: string;
}

/**
 * Computes arm's-length range and validates transaction price.
 */
export function validateTpMethod(
  inputs: readonly TpMethodInput[]
): CalculatorResult<readonly TpMethodResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one transaction required');
  }

  const results: TpMethodResult[] = inputs.map((input) => {
    let base: bigint;
    let computedMarginBps: number;

    switch (input.method) {
      case 'CUP':
        // Direct price comparison — benchmark values ARE the arm's-length prices
        return {
          transactionId: input.transactionId,
          method: input.method,
          computedMarginBps: 0,
          isWithinRange:
            input.transactionPrice >= BigInt(input.benchmarkLowBps) &&
            input.transactionPrice <= BigInt(input.benchmarkHighBps),
          adjustmentRequired: 0n,
          armsLengthPriceLow: BigInt(input.benchmarkLowBps),
          armsLengthPriceMedian: BigInt(input.benchmarkMedianBps),
          armsLengthPriceHigh: BigInt(input.benchmarkHighBps),
          reason: 'CUP: Direct comparable price analysis',
        };

      case 'COST_PLUS':
        base = input.costBase ?? 0n;
        if (base === 0n) {
          return makeZeroResult(input, 'Cost base is zero — cannot compute');
        }
        computedMarginBps =
          base > 0n ? Number(((input.transactionPrice - base) * 10000n) / base) : 0;
        break;

      case 'RESALE_PRICE':
        base = input.revenueBase ?? input.transactionPrice;
        if (base === 0n) {
          return makeZeroResult(input, 'Revenue base is zero — cannot compute');
        }
        computedMarginBps = Number(((base - input.transactionPrice) * 10000n) / base);
        break;

      case 'TNMM':
        base = input.revenueBase ?? 0n;
        if (base === 0n) {
          return makeZeroResult(input, 'Revenue base is zero — cannot compute TNMM');
        }
        computedMarginBps = Number(((input.netProfitBase ?? 0n) * 10000n) / base);
        break;

      case 'PROFIT_SPLIT': {
        const totalPool = input.totalProfitPool ?? 0n;
        if (totalPool === 0n) {
          return makeZeroResult(input, 'Total profit pool is zero');
        }
        const factorBps = input.contributionFactorBps ?? 5000;
        const expectedShare = (totalPool * BigInt(factorBps)) / 10000n;
        computedMarginBps = factorBps;
        const isWithinRange =
          computedMarginBps >= input.benchmarkLowBps && computedMarginBps <= input.benchmarkHighBps;
        return {
          transactionId: input.transactionId,
          method: input.method,
          computedMarginBps,
          isWithinRange,
          adjustmentRequired: isWithinRange ? 0n : expectedShare - input.transactionPrice,
          armsLengthPriceLow: (totalPool * BigInt(input.benchmarkLowBps)) / 10000n,
          armsLengthPriceMedian: (totalPool * BigInt(input.benchmarkMedianBps)) / 10000n,
          armsLengthPriceHigh: (totalPool * BigInt(input.benchmarkHighBps)) / 10000n,
          reason: `Profit split: contribution factor=${factorBps} bps`,
        };
      }
    }

    const isWithinRange =
      computedMarginBps >= input.benchmarkLowBps && computedMarginBps <= input.benchmarkHighBps;

    const medianPrice =
      input.method === 'COST_PLUS'
        ? base + (base * BigInt(input.benchmarkMedianBps)) / 10000n
        : input.method === 'RESALE_PRICE'
          ? (input.revenueBase ?? 0n) -
            ((input.revenueBase ?? 0n) * BigInt(input.benchmarkMedianBps)) / 10000n
          : input.transactionPrice;

    const adjustmentRequired = isWithinRange ? 0n : medianPrice - input.transactionPrice;

    return {
      transactionId: input.transactionId,
      method: input.method,
      computedMarginBps,
      isWithinRange,
      adjustmentRequired,
      armsLengthPriceLow: 0n,
      armsLengthPriceMedian: medianPrice,
      armsLengthPriceHigh: 0n,
      reason: `${input.method}: margin=${computedMarginBps} bps, range=[${input.benchmarkLowBps},${input.benchmarkHighBps}]`,
    };
  });

  const withinRange = results.filter((r) => r.isWithinRange).length;

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `TP validation: ${withinRange}/${inputs.length} within arm's-length range`,
  };
}

function makeZeroResult(input: TpMethodInput, reason: string): TpMethodResult {
  return {
    transactionId: input.transactionId,
    method: input.method,
    computedMarginBps: 0,
    isWithinRange: false,
    adjustmentRequired: 0n,
    armsLengthPriceLow: 0n,
    armsLengthPriceMedian: 0n,
    armsLengthPriceHigh: 0n,
    reason,
  };
}
