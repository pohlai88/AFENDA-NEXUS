import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import {
  reconcileSupplierStatement,
  type SupplierStatementLine,
  type ApLedgerEntry,
  type ReconResult,
} from '../calculators/supplier-statement-recon.js';
import { FinanceEventType } from '../../../shared/events.js';

/**
 * N7: Supplier self-service statement reconciliation.
 *
 * Allows suppliers to upload their statement lines (parsed from CSV/PDF
 * on the frontend) and reconcile them against their AP ledger entries.
 * This wraps the existing `reconcileSupplierStatement()` calculator
 * with supplier-scoped access and emits an audit event.
 */

export interface SupplierStatementLineInput {
  readonly lineRef: string;
  readonly date: string;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface SupplierStatementReconInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly asOfDate: string;
  readonly statementLines: readonly SupplierStatementLineInput[];
  readonly dateTolerance?: number;
  readonly correlationId?: string;
}

export async function supplierStatementRecon(
  input: SupplierStatementReconInput,
  deps: {
    supplierRepo: ISupplierRepo;
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<ReconResult>> {
  // Validate supplier exists and is active
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.status !== 'ACTIVE') {
    return err(new AppError('VALIDATION', 'Supplier is not active'));
  }

  // Validate statement has lines
  if (input.statementLines.length === 0) {
    return err(new AppError('VALIDATION', 'Statement must contain at least one line'));
  }

  // Convert input lines to domain format
  const statementLines: SupplierStatementLine[] = input.statementLines.map((sl) => ({
    lineRef: sl.lineRef,
    date: new Date(sl.date),
    description: sl.description,
    amount: sl.amount,
    currencyCode: sl.currencyCode,
  }));

  // Load supplier's AP invoices as ledger entries
  const invoices = await deps.apInvoiceRepo.findBySupplier(input.supplierId, {
    page: 1,
    limit: 10000,
  });

  const ledgerEntries: ApLedgerEntry[] = invoices.data.map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    amount: inv.totalAmount.amount,
    currencyCode: inv.totalAmount.currency,
    supplierRef: inv.supplierRef,
  }));

  // Run reconciliation
  const result = reconcileSupplierStatement(
    input.supplierId,
    new Date(input.asOfDate),
    statementLines,
    ledgerEntries,
    input.dateTolerance ?? 3
  );

  // Emit audit event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_STATEMENT_UPLOADED,
    payload: {
      supplierId: input.supplierId,
      userId: input.userId,
      asOfDate: input.asOfDate,
      statementLineCount: input.statementLines.length,
      matchedCount: result.matchedCount,
      statementOnlyCount: result.statementOnlyCount,
      ledgerOnlyCount: result.ledgerOnlyCount,
    },
    correlationId: input.correlationId,
  });

  return ok(result);
}
