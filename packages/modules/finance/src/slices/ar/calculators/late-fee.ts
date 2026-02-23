/**
 * AR late fee / interest calculator.
 * Computes late payment interest on overdue AR invoices.
 * Pure calculator — no DB, no side effects.
 *
 * Uses raw bigint for amounts (minor units).
 */

export interface LateFeeInput {
  readonly invoiceId: string;
  readonly outstandingAmount: bigint;
  readonly dueDate: Date;
  readonly asOfDate: Date;
  readonly annualRatePercent: number;
}

export interface LateFeeResult {
  readonly invoiceId: string;
  readonly daysOverdue: number;
  readonly interestAmount: bigint;
  readonly outstandingAmount: bigint;
}

export function computeLateFee(input: LateFeeInput): LateFeeResult {
  const daysOverdue = Math.max(
    0,
    Math.floor((input.asOfDate.getTime() - input.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (daysOverdue === 0) {
    return {
      invoiceId: input.invoiceId,
      daysOverdue: 0,
      interestAmount: 0n,
      outstandingAmount: input.outstandingAmount,
    };
  }

  // Simple interest: principal × rate × days / 365
  // Use integer math: (amount * rate * days) / (365 * 100)
  const interestAmount = (input.outstandingAmount * BigInt(input.annualRatePercent) * BigInt(daysOverdue)) / (365n * 100n);

  return {
    invoiceId: input.invoiceId,
    daysOverdue,
    interestAmount,
    outstandingAmount: input.outstandingAmount,
  };
}

export function computeLateFees(inputs: readonly LateFeeInput[]): readonly LateFeeResult[] {
  return inputs.map(computeLateFee);
}
