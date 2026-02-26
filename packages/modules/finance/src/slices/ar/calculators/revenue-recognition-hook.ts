/**
 * AR-10: Revenue recognition integration hook.
 * Determines how AR invoice revenue should be recognized based on
 * delivery milestones, performance obligations, and contract terms.
 * Pure calculator — no DB, no side effects.
 *
 * This is a hook interface: the AR slice defines the contract,
 * the hub slice (or runtime) provides the implementation.
 * Uses raw bigint for amounts (minor units).
 */

export type RecognitionMethod = 'POINT_IN_TIME' | 'OVER_TIME' | 'DEFERRED';

export interface RevenueScheduleLine {
  readonly periodId: string;
  readonly amount: bigint;
  readonly cumulativePercent: number;
}

export interface RevenueRecognitionInput {
  readonly invoiceId: string;
  readonly customerId: string;
  readonly totalAmount: bigint;
  readonly currencyCode: string;
  readonly invoiceDate: Date;
  readonly deliveryDate: Date | null;
  readonly contractId: string | null;
  readonly performanceObligationsMet: boolean;
}

export interface RevenueRecognitionResult {
  readonly invoiceId: string;
  readonly method: RecognitionMethod;
  readonly recognizedAmount: bigint;
  readonly deferredAmount: bigint;
  readonly schedule: readonly RevenueScheduleLine[];
}

/**
 * Determine revenue recognition for an AR invoice.
 *
 * Rules:
 * - If performance obligations are met and delivery is complete → POINT_IN_TIME (full recognition)
 * - If contract exists but delivery is incomplete → OVER_TIME (partial recognition)
 * - If no delivery and no obligations met → DEFERRED (zero recognition)
 */
export function computeRevenueRecognition(
  input: RevenueRecognitionInput
): RevenueRecognitionResult {
  // POINT_IN_TIME: obligations met + delivered
  if (input.performanceObligationsMet && input.deliveryDate !== null) {
    return {
      invoiceId: input.invoiceId,
      method: 'POINT_IN_TIME',
      recognizedAmount: input.totalAmount,
      deferredAmount: 0n,
      schedule: [
        {
          periodId: formatPeriod(input.deliveryDate),
          amount: input.totalAmount,
          cumulativePercent: 100,
        },
      ],
    };
  }

  // OVER_TIME: contract exists, partial delivery
  if (input.contractId !== null && input.deliveryDate === null) {
    // Default: recognize 0% until delivery milestones are provided
    // In production, this would query the hub slice for the contract schedule
    return {
      invoiceId: input.invoiceId,
      method: 'OVER_TIME',
      recognizedAmount: 0n,
      deferredAmount: input.totalAmount,
      schedule: [],
    };
  }

  // DEFERRED: no delivery, no obligations met
  return {
    invoiceId: input.invoiceId,
    method: 'DEFERRED',
    recognizedAmount: 0n,
    deferredAmount: input.totalAmount,
    schedule: [],
  };
}

function formatPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Batch compute revenue recognition for multiple invoices.
 */
export function computeBatchRevenueRecognition(
  inputs: readonly RevenueRecognitionInput[]
): readonly RevenueRecognitionResult[] {
  return inputs.map(computeRevenueRecognition);
}
