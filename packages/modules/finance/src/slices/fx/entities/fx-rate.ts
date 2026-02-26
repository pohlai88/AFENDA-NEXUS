import type { CompanyId } from '@afenda/core';

export interface FxRate {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: number;
  readonly effectiveDate: Date;
  readonly source: string;
}

/**
 * @deprecated Use convertAmountPrecise from calculators/fx-convert.ts for new code.
 * This wrapper delegates to BigInt fixed-point arithmetic to avoid float precision errors.
 * @see CIG-02 — FX precision CI gate
 */
export function convertAmount(
  amount: bigint,
  rate: number,
  _fromScale: number,
  _toScale: number
): bigint {
  // BigInt fixed-point: multiply amount by scaled rate, then divide by scale
  const PRECISION = 10_000_000_000n;
  // eslint-disable-next-line no-restricted-syntax -- CIG-02 exception: scaling float rate to BigInt is the bridge point
  const scaledRate = BigInt(Math.round(rate * 1e10));
  return (amount * scaledRate + PRECISION / 2n) / PRECISION;
}
