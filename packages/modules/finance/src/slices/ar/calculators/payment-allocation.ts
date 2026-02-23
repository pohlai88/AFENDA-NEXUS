/**
 * AR-02: Payment allocation calculator.
 * Allocates a payment to invoices using FIFO or specific method.
 * Pure calculator — no DB, no side effects.
 */

export interface AllocationInput {
  readonly invoiceId: string;
  readonly outstandingAmount: bigint;
  readonly dueDate: Date;
}

export interface AllocationOutput {
  readonly invoiceId: string;
  readonly allocatedAmount: bigint;
  readonly remainingOnInvoice: bigint;
}

export interface AllocationResult {
  readonly allocations: readonly AllocationOutput[];
  readonly totalAllocated: bigint;
  readonly unallocatedRemainder: bigint;
}

/**
 * FIFO allocation: oldest invoices first (by due date).
 */
export function allocatePaymentFifo(
  paymentAmount: bigint,
  invoices: readonly AllocationInput[],
): AllocationResult {
  const sorted = [...invoices].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  let remaining = paymentAmount;
  const allocations: AllocationOutput[] = [];

  for (const inv of sorted) {
    if (remaining <= 0n) break;

    const toAllocate = remaining >= inv.outstandingAmount ? inv.outstandingAmount : remaining;
    allocations.push({
      invoiceId: inv.invoiceId,
      allocatedAmount: toAllocate,
      remainingOnInvoice: inv.outstandingAmount - toAllocate,
    });
    remaining -= toAllocate;
  }

  return {
    allocations,
    totalAllocated: paymentAmount - remaining,
    unallocatedRemainder: remaining,
  };
}

/**
 * Specific allocation: allocate exact amounts to specified invoices.
 */
export function allocatePaymentSpecific(
  specificAllocations: readonly { invoiceId: string; amount: bigint }[],
  invoices: readonly AllocationInput[],
): AllocationResult {
  const invoiceMap = new Map(invoices.map((i) => [i.invoiceId, i]));
  const allocations: AllocationOutput[] = [];
  let totalAllocated = 0n;

  for (const spec of specificAllocations) {
    const inv = invoiceMap.get(spec.invoiceId);
    if (!inv) continue;

    const toAllocate = spec.amount > inv.outstandingAmount ? inv.outstandingAmount : spec.amount;
    allocations.push({
      invoiceId: spec.invoiceId,
      allocatedAmount: toAllocate,
      remainingOnInvoice: inv.outstandingAmount - toAllocate,
    });
    totalAllocated += toAllocate;
  }

  return {
    allocations,
    totalAllocated,
    unallocatedRemainder: 0n,
  };
}
