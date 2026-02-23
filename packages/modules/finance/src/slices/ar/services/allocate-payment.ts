import type { Result } from "@afenda/core";
import { err, AppError } from "@afenda/core";
import type { ArPaymentAllocation } from "../entities/ar-payment-allocation.js";
import type { IArInvoiceRepo } from "../ports/ar-invoice-repo.js";
import type { IArPaymentAllocationRepo } from "../ports/ar-payment-allocation-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { FinanceContext } from "../../../shared/finance-context.js";
import { FinanceEventType } from "../../../shared/events.js";
import { allocatePaymentFifo, type AllocationInput } from "../calculators/payment-allocation.js";

export interface AllocatePaymentInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly customerId: string;
  readonly paymentDate: Date;
  readonly paymentRef: string;
  readonly paymentAmount: bigint;
  readonly currencyCode: string;
  readonly correlationId?: string;
}

export async function allocatePayment(
  input: AllocatePaymentInput,
  deps: {
    arInvoiceRepo: IArInvoiceRepo;
    arPaymentAllocationRepo: IArPaymentAllocationRepo;
    outboxWriter: IOutboxWriter;
  },
  ctx?: FinanceContext,
): Promise<Result<ArPaymentAllocation>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  // Get unpaid invoices for this customer
  const unpaid = await deps.arInvoiceRepo.findUnpaid();
  const customerInvoices = unpaid.filter((inv) => inv.customerId === input.customerId);

  if (customerInvoices.length === 0) {
    return err(new AppError("VALIDATION", `No unpaid invoices found for customer ${input.customerId}`));
  }

  // FIFO allocation
  const allocationInputs: AllocationInput[] = customerInvoices.map((inv) => ({
    invoiceId: inv.id,
    outstandingAmount: inv.totalAmount.amount - inv.paidAmount.amount,
    dueDate: inv.dueDate,
  }));

  const result = allocatePaymentFifo(input.paymentAmount, allocationInputs);

  if (result.totalAllocated === 0n) {
    return err(new AppError("VALIDATION", "No amount could be allocated"));
  }

  // Create payment allocation record
  const allocationResult = await deps.arPaymentAllocationRepo.create({
    tenantId,
    customerId: input.customerId,
    paymentDate: input.paymentDate,
    paymentRef: input.paymentRef,
    totalAmount: input.paymentAmount,
    currencyCode: input.currencyCode,
  });

  if (!allocationResult.ok) return allocationResult;

  // Record each allocation item and update invoices
  for (const alloc of result.allocations) {
    await deps.arPaymentAllocationRepo.addItem(allocationResult.value.id, {
      invoiceId: alloc.invoiceId,
      allocatedAmount: alloc.allocatedAmount,
    });

    await deps.arInvoiceRepo.recordPayment(alloc.invoiceId, alloc.allocatedAmount);
  }

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AR_PAYMENT_ALLOCATED,
    payload: {
      allocationId: allocationResult.value.id,
      customerId: input.customerId,
      paymentRef: input.paymentRef,
      totalAllocated: result.totalAllocated.toString(),
      invoiceCount: result.allocations.length,
      userId,
      correlationId: input.correlationId,
    },
  });

  // Re-fetch to get updated allocation with items
  return deps.arPaymentAllocationRepo.findById(allocationResult.value.id);
}
