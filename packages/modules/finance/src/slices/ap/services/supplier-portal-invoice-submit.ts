import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';
import {
  batchInvoiceImport,
  type BatchInvoiceRow,
  type BatchImportResult,
} from './batch-invoice-import.js';

/**
 * N1: Supplier electronic invoice submission.
 *
 * Self-service layer wrapping batchInvoiceImport with supplier-scoped
 * enforcement. The supplier can only submit invoices for their own supplierId.
 * Ties to B3 (OCR) and W4-3 (batch import).
 */

export interface SupplierInvoiceSubmitInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly rows: readonly SupplierInvoiceRow[];
  readonly correlationId?: string;
}

export interface SupplierInvoiceRow {
  readonly companyId: string;
  readonly ledgerId: string;
  readonly invoiceNumber: string;
  readonly supplierRef: string | null;
  readonly invoiceDate: string;
  readonly dueDate: string;
  readonly currencyCode: string;
  readonly description: string | null;
  readonly poRef: string | null;
  readonly receiptRef: string | null;
  readonly paymentTermsId: string | null;
  readonly lines: readonly {
    readonly accountId: string;
    readonly description: string | null;
    readonly quantity: number;
    readonly unitPrice: bigint;
    readonly amount: bigint;
    readonly taxAmount: bigint;
  }[];
}

export async function supplierSubmitInvoices(
  input: SupplierInvoiceSubmitInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    supplierRepo: ISupplierRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<BatchImportResult>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('VALIDATION', 'Supplier not found'));
  }

  if (supplierResult.value.status !== 'ACTIVE') {
    return err(new AppError('INVALID_STATE', 'Supplier is not active — cannot submit invoices'));
  }

  if (input.rows.length === 0) {
    return err(new AppError('VALIDATION', 'At least one invoice row is required'));
  }

  const batchRows: BatchInvoiceRow[] = input.rows.map((row) => ({
    ...row,
    supplierId: input.supplierId,
  }));

  const result = await batchInvoiceImport(
    {
      tenantId: input.tenantId,
      userId: input.userId,
      rows: batchRows,
      correlationId: input.correlationId,
    },
    { apInvoiceRepo: deps.apInvoiceRepo, outboxWriter: deps.outboxWriter }
  );

  if (!result.ok) return result;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_INVOICE_SUBMITTED,
    payload: {
      supplierId: input.supplierId,
      totalRows: result.value.totalRows,
      successCount: result.value.successCount,
      errorCount: result.value.errorCount,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return result;
}
