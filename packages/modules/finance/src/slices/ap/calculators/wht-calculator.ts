/**
 * AP-07: Withholding tax at payment calculator.
 * Hook interface for future tax slice integration.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface WhtRate {
  readonly countryCode: string;
  readonly payeeType: "RESIDENT" | "NON_RESIDENT";
  readonly incomeType: string;
  readonly rate: number;
  readonly treatyRate: number | null;
}

export interface WhtResult {
  readonly grossAmount: bigint;
  readonly whtAmount: bigint;
  readonly netPayable: bigint;
  readonly effectiveRate: number;
}

export function computeWht(
  grossAmount: bigint,
  whtRate: WhtRate,
): WhtResult {
  const effectiveRate = whtRate.treatyRate ?? whtRate.rate;

  // eslint-disable-next-line no-restricted-syntax -- integer arithmetic bridge
  const whtAmount = (grossAmount * BigInt(Math.round(effectiveRate * 100))) / 10000n;
  const netPayable = grossAmount - whtAmount;

  return {
    grossAmount,
    whtAmount,
    netPayable,
    effectiveRate,
  };
}
