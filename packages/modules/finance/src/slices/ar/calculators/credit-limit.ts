/**
 * AR credit limit check calculator.
 * Validates whether a new invoice would exceed a customer's credit limit.
 * Pure calculator — no DB, no side effects.
 */

export interface CreditLimitInput {
  readonly customerId: string;
  readonly creditLimit: bigint;
  readonly currentOutstanding: bigint;
  readonly newInvoiceAmount: bigint;
}

export interface CreditLimitResult {
  readonly customerId: string;
  readonly creditLimit: bigint;
  readonly currentOutstanding: bigint;
  readonly newInvoiceAmount: bigint;
  readonly projectedOutstanding: bigint;
  readonly availableCredit: bigint;
  readonly withinLimit: boolean;
  readonly overLimitAmount: bigint;
}

export function checkCreditLimit(input: CreditLimitInput): CreditLimitResult {
  const projectedOutstanding = input.currentOutstanding + input.newInvoiceAmount;
  const availableCredit = input.creditLimit - input.currentOutstanding;
  const withinLimit = projectedOutstanding <= input.creditLimit;
  const overLimitAmount = withinLimit ? 0n : projectedOutstanding - input.creditLimit;

  return {
    customerId: input.customerId,
    creditLimit: input.creditLimit,
    currentOutstanding: input.currentOutstanding,
    newInvoiceAmount: input.newInvoiceAmount,
    projectedOutstanding,
    availableCredit: availableCredit > 0n ? availableCredit : 0n,
    withinLimit,
    overLimitAmount,
  };
}
