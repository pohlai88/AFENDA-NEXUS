import type { Money } from '@afenda/core';

export type PaymentRunStatus = 'DRAFT' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';

export interface PaymentRun {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly runNumber: string;
  readonly runDate: Date;
  readonly cutoffDate: Date;
  readonly currencyCode: string;
  readonly totalAmount: Money;
  readonly status: PaymentRunStatus;
  readonly items: readonly PaymentRunItem[];
  readonly executedAt: Date | null;
  readonly executedBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PaymentRunItem {
  readonly id: string;
  readonly paymentRunId: string;
  readonly invoiceId: string;
  readonly supplierId: string;
  readonly amount: Money;
  readonly discountAmount: Money;
  readonly netAmount: Money;
  readonly journalId: string | null;
}
