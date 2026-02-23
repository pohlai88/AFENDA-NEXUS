import type { Money } from "@afenda/core";

export type AllocationMethod = "FIFO" | "SPECIFIC";

export interface ArPaymentAllocation {
  readonly id: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly paymentDate: Date;
  readonly paymentRef: string;
  readonly totalAmount: Money;
  readonly allocations: readonly AllocationItem[];
  readonly createdAt: Date;
}

export interface AllocationItem {
  readonly id: string;
  readonly paymentAllocationId: string;
  readonly invoiceId: string;
  readonly allocatedAmount: Money;
  readonly journalId: string | null;
}
