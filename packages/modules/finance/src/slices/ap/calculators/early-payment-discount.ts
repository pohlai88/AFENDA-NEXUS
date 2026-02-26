import type { PaymentTerms } from '../entities/payment-terms.js';

/**
 * AP-04: Early payment discount calculator.
 * Computes discount amount for "2/10 net 30" style terms.
 * Pure calculator — no DB, no side effects.
 *
 * Accepts raw bigint (Money.amount) for arithmetic.
 */

export interface DiscountResult {
  readonly eligible: boolean;
  readonly discountAmount: bigint;
  readonly netPayable: bigint;
  readonly discountDeadline: Date | null;
  readonly savingsPercent: number;
}

export function computeEarlyPaymentDiscount(
  invoiceAmount: bigint,
  invoiceDate: Date,
  paymentDate: Date,
  terms: PaymentTerms
): DiscountResult {
  if (terms.discountDays <= 0 || terms.discountPercent <= 0) {
    return {
      eligible: false,
      discountAmount: 0n,
      netPayable: invoiceAmount,
      discountDeadline: null,
      savingsPercent: 0,
    };
  }

  const discountDeadline = new Date(invoiceDate);
  discountDeadline.setDate(discountDeadline.getDate() + terms.discountDays);

  const eligible = paymentDate <= discountDeadline;

  if (!eligible) {
    return {
      eligible: false,
      discountAmount: 0n,
      netPayable: invoiceAmount,
      discountDeadline,
      savingsPercent: 0,
    };
  }

  // discountPercent is stored as whole number (e.g. 2 for 2%)
  // eslint-disable-next-line no-restricted-syntax -- integer arithmetic bridge
  const discountAmount = (invoiceAmount * BigInt(Math.round(terms.discountPercent * 100))) / 10000n;
  const netPayable = invoiceAmount - discountAmount;

  return {
    eligible: true,
    discountAmount,
    netPayable,
    discountDeadline,
    savingsPercent: terms.discountPercent,
  };
}
