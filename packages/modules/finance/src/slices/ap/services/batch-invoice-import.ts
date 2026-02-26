import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo, CreateApInvoiceInput } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface BatchInvoiceRow {
  readonly companyId: string;
  readonly supplierId: string;
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

export interface BatchImportResult {
  readonly totalRows: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly results: readonly BatchRowResult[];
}

export interface BatchRowResult {
  readonly rowIndex: number;
  readonly invoiceNumber: string;
  readonly success: boolean;
  readonly invoice?: ApInvoice;
  readonly error?: string;
}

export interface BatchInvoiceImportInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly rows: readonly BatchInvoiceRow[];
  readonly correlationId?: string;
}

/**
 * W4-3: Batch invoice import.
 *
 * Accepts an array of invoice rows, validates each independently,
 * and returns per-row results. Successful rows are created; failed rows
 * report their error without blocking other rows.
 */
export async function batchInvoiceImport(
  input: BatchInvoiceImportInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
    idempotencyStore?: IIdempotencyStore;
  }
): Promise<Result<BatchImportResult>> {
  if (deps.idempotencyStore && input.correlationId) {
    const claim = await deps.idempotencyStore.claimOrGet({
      tenantId: input.tenantId,
      key: input.correlationId,
      commandType: 'BATCH_INVOICE_IMPORT',
    });
    if (!claim.claimed) {
      return err(
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          `Batch import ${input.correlationId} already processed`
        )
      );
    }
  }

  const results: BatchRowResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]!;

    if (!row.invoiceNumber || row.lines.length === 0) {
      results.push({
        rowIndex: i,
        invoiceNumber: row.invoiceNumber ?? `row-${i}`,
        success: false,
        error: 'Missing invoice number or empty lines',
      });
      errorCount++;
      continue;
    }

    const createInput: CreateApInvoiceInput = {
      tenantId: input.tenantId,
      companyId: row.companyId,
      supplierId: row.supplierId,
      ledgerId: row.ledgerId,
      invoiceNumber: row.invoiceNumber,
      supplierRef: row.supplierRef,
      invoiceDate: new Date(row.invoiceDate),
      dueDate: new Date(row.dueDate),
      currencyCode: row.currencyCode,
      description: row.description,
      poRef: row.poRef,
      receiptRef: row.receiptRef,
      paymentTermsId: row.paymentTermsId,
      lines: row.lines,
    };

    const created = await deps.apInvoiceRepo.create(createInput);
    if (created.ok) {
      results.push({
        rowIndex: i,
        invoiceNumber: row.invoiceNumber,
        success: true,
        invoice: created.value,
      });
      successCount++;
    } else {
      results.push({
        rowIndex: i,
        invoiceNumber: row.invoiceNumber,
        success: false,
        error: created.error instanceof AppError ? created.error.message : 'Unknown error',
      });
      errorCount++;
    }
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_INVOICE_BATCH_IMPORTED,
    payload: {
      totalRows: input.rows.length,
      successCount,
      errorCount,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  const batchResult: BatchImportResult = {
    totalRows: input.rows.length,
    successCount,
    errorCount,
    results,
  };

  if (deps.idempotencyStore && input.correlationId) {
    await deps.idempotencyStore.recordOutcome?.(
      input.tenantId,
      input.correlationId,
      'BATCH_INVOICE_IMPORT',
      JSON.stringify({ successCount, errorCount })
    );
  }

  return ok(batchResult);
}
