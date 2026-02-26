/**
 * W2-9: Clearing explainability — structured trace returned from recordPayment.
 *
 * Captures the before/after state of an invoice clearing operation
 * so callers (and audit logs) can explain exactly what happened.
 */
export interface ClearingTrace {
  readonly invoiceId: string;
  readonly paymentRef: string | null;
  readonly priorBalance: bigint;
  readonly paymentAmount: bigint;
  readonly newBalance: bigint;
  readonly priorStatus: string;
  readonly newStatus: string;
  readonly clearedFully: boolean;
  readonly timestamp: Date;
}
