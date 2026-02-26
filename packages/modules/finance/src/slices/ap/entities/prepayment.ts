import type { Money } from '@afenda/core';

/**
 * W4-2: Prepayment entity.
 *
 * Tracks advance payments to suppliers before invoice receipt.
 * A prepayment has an unapplied balance that decreases as it is
 * applied against future invoices.
 */
export interface ApPrepayment {
  readonly id: string;
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly supplierId: string;
  readonly totalAmount: Money;
  readonly appliedAmount: Money;
  readonly unappliedBalance: Money;
  readonly status: ApPrepaymentStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly applications: readonly PrepaymentApplication[];
}

export type ApPrepaymentStatus = 'OPEN' | 'PARTIALLY_APPLIED' | 'FULLY_APPLIED' | 'CANCELLED';

export interface PrepaymentApplication {
  readonly id: string;
  readonly prepaymentId: string;
  readonly targetInvoiceId: string;
  readonly amount: Money;
  readonly appliedAt: Date;
  readonly appliedBy: string;
}
