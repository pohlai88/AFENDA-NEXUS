import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import { generateRemittanceAdvice } from './generate-remittance-advice.js';

/**
 * N4: Supplier self-service remittance advice download.
 *
 * Wraps the existing generateRemittanceAdvice() service with supplier-scoped
 * filtering so the supplier only sees their own remittance items.
 * Emits a download audit event.
 */

export interface SupplierRemittanceDownloadInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly paymentRunId: string;
  readonly correlationId?: string;
}

export interface SupplierRemittanceAdvice {
  readonly paymentRunId: string;
  readonly runNumber: string;
  readonly runDate: Date;
  readonly currencyCode: string;
  readonly supplierName: string;
  readonly items: readonly {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly grossAmount: bigint;
    readonly discountAmount: bigint;
    readonly netAmount: bigint;
  }[];
  readonly totalGross: bigint;
  readonly totalDiscount: bigint;
  readonly totalNet: bigint;
}

export async function supplierDownloadRemittance(
  input: SupplierRemittanceDownloadInput,
  deps: {
    apPaymentRunRepo: IApPaymentRunRepo;
    supplierRepo: ISupplierRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<SupplierRemittanceAdvice>> {
  const adviceResult = await generateRemittanceAdvice(
    {
      tenantId: input.tenantId,
      userId: input.userId,
      paymentRunId: input.paymentRunId,
      correlationId: input.correlationId,
    },
    deps
  );

  if (!adviceResult.ok) return adviceResult as Result<never>;

  const advice = adviceResult.value;
  const supplierData = advice.suppliers.find((s) => s.supplierId === input.supplierId);

  if (!supplierData) {
    return err(
      new AppError('VALIDATION', 'No remittance items found for this supplier in the payment run')
    );
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_REMITTANCE_DOWNLOADED,
    payload: {
      supplierId: input.supplierId,
      paymentRunId: input.paymentRunId,
      itemCount: supplierData.items.length,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return {
    ok: true,
    value: {
      paymentRunId: advice.paymentRunId,
      runNumber: advice.runNumber,
      runDate: advice.runDate,
      currencyCode: advice.currencyCode,
      supplierName: supplierData.supplierName,
      items: supplierData.items,
      totalGross: supplierData.totalGross,
      totalDiscount: supplierData.totalDiscount,
      totalNet: supplierData.totalNet,
    },
  };
}
