/**
 * AR-09: Invoice discounting / factoring calculator.
 * Computes the net proceeds from selling receivables to a factor,
 * including discount charges and holdback reserves.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface FactoringInput {
  readonly invoiceId: string;
  readonly customerId: string;
  readonly faceValue: bigint;
  readonly currencyCode: string;
  readonly dueDate: Date;
  readonly factoringDate: Date;
  /** Discount rate in basis points (e.g. 250 = 2.50%). Integer only — no floats. */
  readonly discountRateBps: number;
  /** Holdback reserve in basis points (e.g. 1000 = 10.00%). Integer only — no floats. */
  readonly holdbackBps: number;
}

export interface FactoringResult {
  readonly invoiceId: string;
  readonly faceValue: bigint;
  readonly daysToMaturity: number;
  readonly discountCharge: bigint;
  readonly holdbackAmount: bigint;
  readonly netProceeds: bigint;
  /** Effective annual rate in basis points. */
  readonly effectiveAnnualRateBps: number;
}

/**
 * Compute factoring proceeds for a single invoice.
 * All rates are integer basis points — no float arithmetic on money.
 *
 * discount = faceValue * discountRateBps * daysToMaturity / (365 * 10000)
 * holdback = faceValue * holdbackBps / 10000
 * netProceeds = faceValue - discount - holdback
 */
export function computeInvoiceDiscounting(input: FactoringInput): FactoringResult {
  const daysToMaturity = Math.max(
    0,
    Math.ceil((input.dueDate.getTime() - input.factoringDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const discountCharge =
    (input.faceValue * BigInt(input.discountRateBps) * BigInt(daysToMaturity)) / (365n * 10000n);

  const holdbackAmount = (input.faceValue * BigInt(input.holdbackBps)) / 10000n;

  const netProceeds = input.faceValue - discountCharge - holdbackAmount;

  // Effective annual rate in bps: (discountCharge / faceValue) * (365 / days) * 10000
  const effectiveAnnualRateBps =
    daysToMaturity > 0
      ? Number((discountCharge * 3650000n) / (input.faceValue * BigInt(daysToMaturity)))
      : 0;

  return {
    invoiceId: input.invoiceId,
    faceValue: input.faceValue,
    daysToMaturity,
    discountCharge,
    holdbackAmount,
    netProceeds,
    effectiveAnnualRateBps,
  };
}

/**
 * Batch compute factoring for multiple invoices.
 */
export function computeBatchDiscounting(
  inputs: readonly FactoringInput[]
): readonly FactoringResult[] {
  return inputs.map(computeInvoiceDiscounting);
}
