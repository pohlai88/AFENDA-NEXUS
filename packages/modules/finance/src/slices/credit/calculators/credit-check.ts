/**
 * CM-01: Credit limit check calculator.
 * Validates whether a new transaction would exceed the customer's credit limit.
 * Pure calculator — no DB, no side effects.
 */

export interface CreditCheckInput {
  readonly customerId: string;
  readonly currentExposure: bigint;
  readonly creditLimit: bigint;
  readonly transactionAmount: bigint;
  readonly currencyCode: string;
}

export type CreditDecision = "APPROVED" | "HOLD" | "REJECTED";

export interface CreditCheckResult {
  readonly customerId: string;
  readonly decision: CreditDecision;
  readonly transactionAmount: bigint;
  readonly projectedExposure: bigint;
  readonly creditLimit: bigint;
  readonly headroom: bigint;
  readonly reason: string;
}

/**
 * Check if a transaction can proceed given the customer's credit limit.
 */
export function checkCreditLimit(input: CreditCheckInput): CreditCheckResult {
  const projectedExposure = input.currentExposure + input.transactionAmount;
  const headroom = input.creditLimit - projectedExposure;

  let decision: CreditDecision;
  let reason: string;

  if (projectedExposure <= input.creditLimit) {
    decision = "APPROVED";
    reason = "Within credit limit";
  } else if (input.currentExposure <= input.creditLimit) {
    // Currently within limit but this transaction would breach it
    decision = "HOLD";
    reason = `Transaction would exceed limit by ${-headroom}`;
  } else {
    // Already over limit
    decision = "REJECTED";
    reason = `Already over limit by ${input.currentExposure - input.creditLimit}`;
  }

  return {
    customerId: input.customerId,
    decision,
    transactionAmount: input.transactionAmount,
    projectedExposure,
    creditLimit: input.creditLimit,
    headroom,
    reason,
  };
}
