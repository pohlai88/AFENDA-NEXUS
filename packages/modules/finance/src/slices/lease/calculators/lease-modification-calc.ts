/**
 * LA-03: Lease modification (remeasurement) calculator.
 * Computes liability adjustment and ROU asset adjustment on lease modification.
 * Pure calculator — no DB, no side effects.
 */

export interface LeaseModificationCalcInput {
  readonly currentLiability: bigint;
  readonly remainingTermMonths: number;
  readonly newTermMonths: number;
  readonly currentMonthlyPayment: bigint;
  readonly newMonthlyPayment: bigint;
  /** New annual discount rate in basis points */
  readonly newDiscountRateBps: number;
  readonly currencyCode: string;
}

export interface LeaseModificationCalcResult {
  readonly revisedLiability: bigint;
  readonly liabilityAdjustment: bigint;
  readonly rouAssetAdjustment: bigint;
  readonly gainLossOnModification: bigint;
  readonly currencyCode: string;
}

export function computeLeaseModification(input: LeaseModificationCalcInput): LeaseModificationCalcResult {
  const annualRate = input.newDiscountRateBps / 10000;
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

  let pvNewPayments = 0;
  const newPayment = Number(input.newMonthlyPayment);

  for (let m = 1; m <= input.newTermMonths; m++) {
    const discountFactor = Math.pow(1 + monthlyRate, -m);
    pvNewPayments += newPayment * discountFactor;
  }

  const revisedLiability = BigInt(Math.round(pvNewPayments));
  const liabilityAdjustment = revisedLiability - input.currentLiability;

  // If scope decreased → gain/loss; if scope same/increased → adjust ROU asset
  const isScopeDecrease = input.newTermMonths < input.remainingTermMonths &&
    input.newMonthlyPayment <= input.currentMonthlyPayment;

  let gainLossOnModification = 0n;
  let rouAssetAdjustment: bigint;

  if (isScopeDecrease) {
    const proportionReduced = 1 - (input.newTermMonths / input.remainingTermMonths);
    // eslint-disable-next-line no-restricted-syntax -- CIG-02 bridge: PV discount requires float arithmetic, result rounded to BigInt
    const proportionalLiability = BigInt(Math.round(Number(input.currentLiability) * proportionReduced));
    gainLossOnModification = proportionalLiability - proportionalLiability;
    rouAssetAdjustment = liabilityAdjustment - gainLossOnModification;
  } else {
    rouAssetAdjustment = liabilityAdjustment;
  }

  return {
    revisedLiability,
    liabilityAdjustment,
    rouAssetAdjustment,
    gainLossOnModification,
    currencyCode: input.currencyCode,
  };
}
