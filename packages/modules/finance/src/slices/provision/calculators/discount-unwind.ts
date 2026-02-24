/**
 * PR-02: Best estimate + discount unwinding calculator.
 * Computes the time-value unwinding of a discounted provision.
 * Pure calculator — no DB, no side effects.
 */

export interface DiscountUnwindInput {
  readonly currentAmount: bigint;
  /** Annual discount rate in basis points (e.g., 500 = 5.00%) */
  readonly discountRateBps: number;
  readonly periodsRemaining: number;
  readonly currencyCode: string;
}

export interface DiscountUnwindResult {
  readonly unwindAmount: bigint;
  readonly newBalance: bigint;
  readonly presentValue: bigint;
  readonly currencyCode: string;
}

export function computeDiscountUnwind(input: DiscountUnwindInput): DiscountUnwindResult {
  if (input.discountRateBps === 0 || input.periodsRemaining <= 0) {
    return {
      unwindAmount: 0n,
      newBalance: input.currentAmount,
      presentValue: input.currentAmount,
      currencyCode: input.currencyCode,
    };
  }

  const annualRate = input.discountRateBps / 10000;
  // eslint-disable-next-line no-restricted-syntax -- CIG-02 bridge: discount unwinding requires float arithmetic, result rounded to BigInt
  const unwindFloat = Number(input.currentAmount) * annualRate;
  const unwindAmount = BigInt(Math.round(unwindFloat));
  const newBalance = input.currentAmount + unwindAmount;

  // PV of remaining obligation
  const pvFloat = Number(input.currentAmount) / Math.pow(1 + annualRate, input.periodsRemaining);
  const presentValue = BigInt(Math.round(pvFloat));

  return { unwindAmount, newBalance, presentValue, currencyCode: input.currencyCode };
}
