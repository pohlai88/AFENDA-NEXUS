/**
 * LA-04: Short-term and low-value lease exemption calculator.
 * Determines if a lease qualifies for IFRS 16 exemptions.
 * Pure calculator — no DB, no side effects.
 */

export interface LeaseExemptionInput {
  readonly leaseTermMonths: number;
  readonly totalLeasePayments: bigint;
  readonly underlyingAssetFairValue: bigint;
  readonly currencyCode: string;
}

export interface LeaseExemptionResult {
  readonly isShortTerm: boolean;
  readonly isLowValue: boolean;
  readonly isExempt: boolean;
  readonly exemptionReason: string | null;
}

/** IFRS 16 thresholds */
const SHORT_TERM_THRESHOLD_MONTHS = 12;
const LOW_VALUE_THRESHOLD = 5000_00n; // $5,000 in cents

export function checkLeaseExemptions(input: LeaseExemptionInput): LeaseExemptionResult {
  const isShortTerm = input.leaseTermMonths <= SHORT_TERM_THRESHOLD_MONTHS;
  const isLowValue = input.underlyingAssetFairValue <= LOW_VALUE_THRESHOLD;
  const isExempt = isShortTerm || isLowValue;

  let exemptionReason: string | null = null;
  if (isShortTerm && isLowValue) {
    exemptionReason = 'Short-term lease (≤12 months) and low-value asset (≤$5,000)';
  } else if (isShortTerm) {
    exemptionReason = 'Short-term lease (≤12 months)';
  } else if (isLowValue) {
    exemptionReason = 'Low-value underlying asset (≤$5,000)';
  }

  return { isShortTerm, isLowValue, isExempt, exemptionReason };
}
