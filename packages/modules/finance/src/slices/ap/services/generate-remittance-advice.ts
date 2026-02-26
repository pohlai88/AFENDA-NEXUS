import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface GenerateRemittanceAdviceInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly paymentRunId: string;
  readonly correlationId?: string;
}

export interface RemittanceAdvice {
  readonly paymentRunId: string;
  readonly runNumber: string;
  readonly runDate: Date;
  readonly currencyCode: string;
  readonly suppliers: readonly SupplierRemittance[];
}

export interface SupplierRemittance {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly items: readonly RemittanceLineItem[];
  readonly totalGross: bigint;
  readonly totalDiscount: bigint;
  readonly totalNet: bigint;
}

export interface RemittanceLineItem {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly grossAmount: bigint;
  readonly discountAmount: bigint;
  readonly netAmount: bigint;
}

/**
 * W4-6: Remittance advice generation.
 *
 * Generates a structured remittance advice document per supplier for a
 * given payment run. The output can be rendered as PDF or sent via email.
 *
 * Groups payment items by supplier and includes invoice-level detail.
 */
export async function generateRemittanceAdvice(
  input: GenerateRemittanceAdviceInput,
  deps: {
    apPaymentRunRepo: IApPaymentRunRepo;
    supplierRepo: ISupplierRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<RemittanceAdvice>> {
  const found = await deps.apPaymentRunRepo.findById(input.paymentRunId);
  if (!found.ok) return found as Result<never>;

  const run = found.value;

  // Group items by supplier
  const supplierMap = new Map<
    string,
    { items: RemittanceLineItem[]; totalGross: bigint; totalDiscount: bigint; totalNet: bigint }
  >();

  for (const item of run.items) {
    const entry = supplierMap.get(item.supplierId) ?? {
      items: [],
      totalGross: 0n,
      totalDiscount: 0n,
      totalNet: 0n,
    };

    entry.items.push({
      invoiceId: item.invoiceId,
      invoiceNumber: item.invoiceId, // Will be resolved from invoice if needed
      grossAmount: item.amount.amount,
      discountAmount: item.discountAmount.amount,
      netAmount: item.netAmount.amount,
    });

    entry.totalGross += item.amount.amount;
    entry.totalDiscount += item.discountAmount.amount;
    entry.totalNet += item.netAmount.amount;
    supplierMap.set(item.supplierId, entry);
  }

  // Resolve supplier names
  const suppliers: SupplierRemittance[] = [];
  for (const [supplierId, data] of [...supplierMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    let supplierName = supplierId;
    const supplierResult = await deps.supplierRepo.findById(supplierId);
    if (supplierResult.ok) {
      supplierName = supplierResult.value.name;
    }

    suppliers.push({
      supplierId,
      supplierName,
      items: data.items,
      totalGross: data.totalGross,
      totalDiscount: data.totalDiscount,
      totalNet: data.totalNet,
    });
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_REMITTANCE_ADVICE_GENERATED,
    payload: {
      paymentRunId: input.paymentRunId,
      supplierCount: suppliers.length,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return ok({
    paymentRunId: run.id,
    runNumber: run.runNumber,
    runDate: run.runDate,
    currencyCode: run.currencyCode,
    suppliers,
  });
}
