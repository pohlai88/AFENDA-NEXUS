import { ok } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { ApHold } from '../entities/ap-hold.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IApHoldRepo } from '../ports/ap-hold-repo.js';
import { detectDuplicates } from '../calculators/duplicate-detection.js';
import type { InvoiceFingerprint } from '../calculators/duplicate-detection.js';
import { threeWayMatch } from '../calculators/three-way-match.js';
import type { MatchInput } from '../calculators/three-way-match.js';
import { money } from '@afenda/core';

export interface ValidateInvoiceInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly poAmount?: bigint;
  readonly receiptAmount?: bigint;
  readonly currencyCode?: string;
  readonly tolerancePercent?: number;
}

export interface ValidationResult {
  readonly invoice: ApInvoice;
  readonly holds: readonly ApHold[];
  readonly duplicateGroupSize: number;
  readonly matchStatus: string | null;
}

export interface ValidateInvoiceDeps {
  readonly apInvoiceRepo: IApInvoiceRepo;
  readonly apHoldRepo: IApHoldRepo;
}

export async function validateInvoice(
  input: ValidateInvoiceInput,
  deps: ValidateInvoiceDeps
): Promise<Result<ValidationResult>> {
  const invoiceResult = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!invoiceResult.ok) return invoiceResult;

  const invoice = invoiceResult.value;
  const newHolds: ApHold[] = [];

  // ── Duplicate detection ──────────────────────────────────────────────────
  if (invoice.supplierRef) {
    const supplierInvoices = await deps.apInvoiceRepo.findBySupplier(invoice.supplierId, {
      page: 1,
      limit: 500,
    });

    const fingerprints: InvoiceFingerprint[] = supplierInvoices.data
      .filter((inv) => inv.supplierRef !== null)
      .map((inv) => ({
        invoiceId: inv.id,
        supplierId: inv.supplierId,
        supplierRef: inv.supplierRef!,
        totalAmount: inv.totalAmount.amount,
        invoiceDate: inv.invoiceDate,
      }));

    const dupes = detectDuplicates(fingerprints);
    const invoiceDupeGroup = dupes.find((g) =>
      g.invoices.some((i) => i.invoiceId === input.invoiceId)
    );

    if (invoiceDupeGroup && invoiceDupeGroup.invoices.length > 1) {
      const dupeIds = invoiceDupeGroup.invoices
        .filter((i) => i.invoiceId !== input.invoiceId)
        .map((i) => i.invoiceId);

      const holdResult = await deps.apHoldRepo.create({
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        holdType: 'DUPLICATE',
        holdReason: `Potential duplicate of invoice(s): ${dupeIds.join(', ')}`,
        createdBy: input.userId,
      });
      if (holdResult.ok) newHolds.push(holdResult.value);
    }
  }

  // ── 3-way match ──────────────────────────────────────────────────────────
  let matchStatus: string | null = null;
  if (input.poAmount !== undefined && input.receiptAmount !== undefined && input.currencyCode) {
    const matchInput: MatchInput = {
      poAmount: money(input.poAmount, input.currencyCode),
      receiptAmount: money(input.receiptAmount, input.currencyCode),
      invoiceAmount: invoice.totalAmount,
      tolerancePercent: input.tolerancePercent ?? 1,
    };

    const result = threeWayMatch(matchInput);
    matchStatus = result.status;

    if (result.status === 'OVER_TOLERANCE') {
      const holdResult = await deps.apHoldRepo.create({
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        holdType: 'MATCH_EXCEPTION',
        holdReason: `3-way match OVER_TOLERANCE: variance ${result.variancePercent}% exceeds ${input.tolerancePercent ?? 1}%`,
        createdBy: input.userId,
      });
      if (holdResult.ok) newHolds.push(holdResult.value);
    } else if (result.status === 'QUANTITY_MISMATCH' || result.status === 'PRICE_MISMATCH') {
      const holdResult = await deps.apHoldRepo.create({
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        holdType: 'MATCH_EXCEPTION',
        holdReason: `3-way match ${result.status}`,
        createdBy: input.userId,
      });
      if (holdResult.ok) newHolds.push(holdResult.value);
    }
  }

  return ok({
    invoice,
    holds: newHolds,
    duplicateGroupSize: newHolds.filter((h) => h.holdType === 'DUPLICATE').length > 0 ? 2 : 0,
    matchStatus,
  });
}
