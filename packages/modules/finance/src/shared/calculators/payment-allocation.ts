/**
 * Shared payment allocation calculator.
 * Pure logic — determines new status after a payment is applied.
 * Used by both AP and AR repos to ensure consistent status transitions.
 */

export type PaymentAllocationStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNCHANGED';

export interface PaymentAllocationInput {
  readonly currentPaidAmount: bigint;
  readonly paymentAmount: bigint;
  readonly totalAmount: bigint;
}

export interface PaymentAllocationResult {
  readonly newPaidAmount: bigint;
  readonly status: PaymentAllocationStatus;
}

export function computePaymentAllocation(input: PaymentAllocationInput): PaymentAllocationResult {
  const { currentPaidAmount, paymentAmount, totalAmount } = input;

  if (paymentAmount <= 0n) {
    throw new Error('Payment amount must be positive');
  }

  const newPaidAmount = currentPaidAmount + paymentAmount;

  if (newPaidAmount > totalAmount) {
    throw new Error(
      `Payment would exceed total: paid=${currentPaidAmount} + payment=${paymentAmount} > total=${totalAmount}`
    );
  }

  const status: PaymentAllocationStatus =
    newPaidAmount >= totalAmount ? 'PAID' : newPaidAmount > 0n ? 'PARTIALLY_PAID' : 'UNCHANGED';

  return { newPaidAmount, status };
}
