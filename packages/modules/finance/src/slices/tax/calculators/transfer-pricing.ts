/**
 * TX-10: Transfer pricing arm's-length validation.
 * Calculator hook for validating intercompany transaction prices
 * against arm's-length benchmarks.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export type TransferPricingMethod =
  | 'CUP' // Comparable Uncontrolled Price
  | 'RPM' // Resale Price Method
  | 'CPM' // Cost Plus Method
  | 'TNMM' // Transactional Net Margin Method
  | 'PSM'; // Profit Split Method

export interface TransferPricingInput {
  readonly transactionId: string;
  readonly sellerCompanyId: string;
  readonly buyerCompanyId: string;
  readonly transactionAmount: bigint;
  readonly currencyCode: string;
  readonly method: TransferPricingMethod;
  /** Arm's-length benchmark price for the same goods/services. */
  readonly benchmarkAmount: bigint;
  /** Acceptable variance in basis points (e.g. 500 = 5.00%). */
  readonly toleranceBps: number;
}

export type TransferPricingStatus = 'WITHIN_RANGE' | 'BELOW_RANGE' | 'ABOVE_RANGE';

export interface TransferPricingResult {
  readonly transactionId: string;
  readonly status: TransferPricingStatus;
  readonly transactionAmount: bigint;
  readonly benchmarkAmount: bigint;
  readonly varianceAmount: bigint;
  /** Variance in basis points relative to benchmark. */
  readonly varianceBps: number;
  readonly toleranceBps: number;
  readonly adjustmentRequired: bigint;
}

/**
 * Validate a transfer price against arm's-length benchmark.
 */
export function validateTransferPrice(input: TransferPricingInput): TransferPricingResult {
  const varianceAmount = input.transactionAmount - input.benchmarkAmount;
  const absVariance = varianceAmount < 0n ? -varianceAmount : varianceAmount;

  // Variance in bps: (absVariance / benchmark) * 10000
  const varianceBps =
    input.benchmarkAmount !== 0n ? Number((absVariance * 10000n) / input.benchmarkAmount) : 0;

  let status: TransferPricingStatus;
  let adjustmentRequired = 0n;

  if (varianceBps <= input.toleranceBps) {
    status = 'WITHIN_RANGE';
  } else if (varianceAmount > 0n) {
    status = 'ABOVE_RANGE';
    adjustmentRequired =
      varianceAmount - (input.benchmarkAmount * BigInt(input.toleranceBps)) / 10000n;
  } else {
    status = 'BELOW_RANGE';
    adjustmentRequired =
      -varianceAmount - (input.benchmarkAmount * BigInt(input.toleranceBps)) / 10000n;
  }

  return {
    transactionId: input.transactionId,
    status,
    transactionAmount: input.transactionAmount,
    benchmarkAmount: input.benchmarkAmount,
    varianceAmount,
    varianceBps,
    toleranceBps: input.toleranceBps,
    adjustmentRequired: adjustmentRequired < 0n ? 0n : adjustmentRequired,
  };
}

/**
 * Batch validate transfer prices.
 */
export function validateBatchTransferPrices(
  inputs: readonly TransferPricingInput[]
): readonly TransferPricingResult[] {
  return inputs.map(validateTransferPrice);
}
