/**
 * LA-02: Lease amortization schedule calculator.
 * Splits each payment into interest and principal portions.
 * Pure calculator — no DB, no side effects.
 */

export interface AmortizationScheduleInput {
  readonly leaseLiability: bigint;
  readonly leaseTermMonths: number;
  readonly monthlyPayment: bigint;
  /** Annual discount rate in basis points (e.g., 500 = 5.00%) */
  readonly annualDiscountRateBps: number;
  /** Annual escalation rate in basis points (e.g., 300 = 3.00%) */
  readonly annualEscalationBps: number;
  readonly rouAsset: bigint;
  readonly currencyCode: string;
}

export interface AmortizationLine {
  readonly periodNumber: number;
  readonly paymentAmount: bigint;
  readonly interestPortion: bigint;
  readonly principalPortion: bigint;
  readonly openingLiability: bigint;
  readonly closingLiability: bigint;
  readonly rouDepreciation: bigint;
}

export interface AmortizationScheduleResult {
  readonly lines: readonly AmortizationLine[];
  readonly totalInterest: bigint;
  readonly totalPrincipal: bigint;
  readonly totalDepreciation: bigint;
  readonly currencyCode: string;
}

export function computeAmortizationSchedule(input: AmortizationScheduleInput): AmortizationScheduleResult {
  const annualRate = input.annualDiscountRateBps / 10000;
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const escalationRate = input.annualEscalationBps / 10000;
  const monthlyDepreciation = input.rouAsset / BigInt(input.leaseTermMonths);

  const lines: AmortizationLine[] = [];
  let openingLiability = Number(input.leaseLiability);
  let currentPayment = Number(input.monthlyPayment);
  let totalInterest = 0n;
  let totalPrincipal = 0n;
  let totalDepreciation = 0n;

  for (let m = 1; m <= input.leaseTermMonths; m++) {
    if (m > 1 && (m - 1) % 12 === 0) {
      currentPayment = currentPayment * (1 + escalationRate);
    }

    const interest = openingLiability * monthlyRate;
    const principal = currentPayment - interest;
    const closingLiability = openingLiability - principal;

    const interestBig = BigInt(Math.round(interest));
    const principalBig = BigInt(Math.round(principal));
    const paymentBig = BigInt(Math.round(currentPayment));
    const openBig = BigInt(Math.round(openingLiability));
    const closeBig = BigInt(Math.round(Math.max(0, closingLiability)));

    lines.push({
      periodNumber: m,
      paymentAmount: paymentBig,
      interestPortion: interestBig,
      principalPortion: principalBig,
      openingLiability: openBig,
      closingLiability: closeBig,
      rouDepreciation: monthlyDepreciation,
    });

    totalInterest += interestBig;
    totalPrincipal += principalBig;
    totalDepreciation += monthlyDepreciation;
    openingLiability = Math.max(0, closingLiability);
  }

  return { lines, totalInterest, totalPrincipal, totalDepreciation, currencyCode: input.currencyCode };
}
