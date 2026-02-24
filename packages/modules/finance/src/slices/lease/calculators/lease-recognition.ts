/**
 * LA-01: ROU asset + lease liability recognition calculator.
 * Computes present value of lease payments per IFRS 16.
 * Pure calculator — no DB, no side effects.
 */

export interface LeaseRecognitionInput {
  readonly leaseTermMonths: number;
  readonly monthlyPayment: bigint;
  /** Annual discount rate in basis points (e.g., 500 = 5.00%) */
  readonly annualDiscountRateBps: number;
  /** Annual escalation rate in basis points (e.g., 300 = 3.00%) */
  readonly annualEscalationBps: number;
  readonly currencyCode: string;
}

export interface LeaseRecognitionResult {
  readonly leaseLiability: bigint;
  readonly rouAsset: bigint;
  readonly totalUndiscountedPayments: bigint;
  readonly totalInterest: bigint;
  readonly currencyCode: string;
}

/**
 * Computes PV of future lease payments.
 * Monthly discount factor = (1 + annualRate)^(1/12) - 1
 * Escalation applied annually.
 */
export function computeLeaseRecognition(input: LeaseRecognitionInput): LeaseRecognitionResult {
  const annualRate = input.annualDiscountRateBps / 10000;
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const escalationRate = input.annualEscalationBps / 10000;

  let pvTotal = 0;
  let undiscountedTotal = 0n;
  let currentPayment = Number(input.monthlyPayment);

  for (let m = 1; m <= input.leaseTermMonths; m++) {
    if (m > 1 && (m - 1) % 12 === 0) {
      currentPayment = currentPayment * (1 + escalationRate);
    }
    const discountFactor = Math.pow(1 + monthlyRate, -m);
    pvTotal += currentPayment * discountFactor;
    undiscountedTotal += BigInt(Math.round(currentPayment));
  }

  const leaseLiability = BigInt(Math.round(pvTotal));
  const rouAsset = leaseLiability;
  const totalInterest = undiscountedTotal - leaseLiability;

  return {
    leaseLiability,
    rouAsset,
    totalUndiscountedPayments: undiscountedTotal,
    totalInterest,
    currencyCode: input.currencyCode,
  };
}
