import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';

/**
 * SP-5016 — CAP-CRDB: Credit / Debit Note Submission
 *
 * A supplier can issue a credit note (reduces the amount owed) or debit note
 * (increases the amount owed) against a previous invoice.
 *
 * Mapping:
 *   CREDIT_NOTE → CREDIT_MEMO
 *   DEBIT_NOTE  → DEBIT_MEMO
 *
 * SOX constraints:
 * - Original invoice must belong to the same supplierId.
 * - Amount is stored as a DRAFT invoice with negative (credit) or positive (debit) line.
 * - `originalInvoiceId` is set so the note can be reconciled later.
 */

const DOCUMENT_TYPE_MAP = {
  CREDIT_NOTE: 'CREDIT_MEMO',
  DEBIT_NOTE: 'DEBIT_MEMO',
} as const satisfies Record<'CREDIT_NOTE' | 'DEBIT_NOTE', 'CREDIT_MEMO' | 'DEBIT_MEMO'>;

export type CrdbDocumentType = keyof typeof DOCUMENT_TYPE_MAP;

export interface SubmitCrdbInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly userId: string;
  readonly documentType: CrdbDocumentType;
  /** UUID of the original invoice being adjusted. */
  readonly originalInvoiceId: string;
  /** Supplier-assigned note number. */
  readonly noteNumber: string;
  /** YYYY-MM-DD */
  readonly noteDate: string;
  readonly reason: string;
  /** Adjustment magnitude in minor currency units (always positive bigint). */
  readonly adjustmentAmountMinorUnit: bigint;
  readonly currencyCode: string;
  /** Resolved from the AP context — the company hosting the original invoice. */
  readonly companyId: string;
  /** Resolved from the AP context. */
  readonly ledgerId: string;
  readonly poRef?: string;
}

export interface CrdbResult {
  readonly id: string;
  readonly invoiceType: 'CREDIT_MEMO' | 'DEBIT_MEMO';
  readonly status: string;
  readonly noteNumber: string;
  readonly originalInvoiceId: string;
}

export type CrdbError =
  | { code: 'SUPPLIER_NOT_FOUND' }
  | { code: 'SUPPLIER_NOT_ACTIVE' }
  | { code: 'ORIGINAL_INVOICE_NOT_FOUND' }
  | { code: 'ORIGINAL_INVOICE_WRONG_SUPPLIER' }
  | { code: 'CURRENCY_MISMATCH'; expected: string; got: string }
  | { code: 'INVALID_DATE' }
  | { code: 'CREATE_FAILED'; message: string };

export async function submitCreditDebitNote(
  input: SubmitCrdbInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    supplierRepo: ISupplierRepo;
  }
): Promise<Result<CrdbResult>> {
  // ── 1. Supplier guard ─────────────────────────────────────────────────────
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('NOT_FOUND', 'Supplier not found'));
  }
  if (supplierResult.value.status !== 'ACTIVE') {
    return err(new AppError('INVALID_STATE', 'Supplier is not active — cannot submit documents'));
  }

  // ── 2. Original invoice guard ─────────────────────────────────────────────
  const origResult = await deps.apInvoiceRepo.findById(input.originalInvoiceId);
  if (!origResult.ok) {
    return err(new AppError('NOT_FOUND', 'Original invoice not found'));
  }
  const orig = origResult.value;

  if (orig.supplierId !== input.supplierId) {
    return err(new AppError('FORBIDDEN', 'Original invoice does not belong to this supplier'));
  }

  if (orig.totalAmount.currency !== input.currencyCode) {
    return err(
      new AppError(
        'VALIDATION',
        `Currency mismatch: original invoice is in ${orig.totalAmount.currency}, note is in ${input.currencyCode}`
      )
    );
  }

  // ── 3. Date parsing ───────────────────────────────────────────────────────
  const noteDate = new Date(input.noteDate);
  if (isNaN(noteDate.getTime())) {
    return err(new AppError('VALIDATION', 'Invalid note date — expected YYYY-MM-DD'));
  }

  // Net terms: due 30 days from note date
  const dueDate = new Date(noteDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // ── 4. Resolve account from original invoice first line ───────────────────
  const firstLineAccountId = orig.lines[0]?.accountId ?? '';

  // For credit notes, amount is negative in the AP system (reduces liability).
  // For debit notes, amount is positive.
  const signedAmount =
    input.documentType === 'CREDIT_NOTE'
      ? -input.adjustmentAmountMinorUnit
      : input.adjustmentAmountMinorUnit;

  // ── 5. Create the note as a DRAFT invoice ─────────────────────────────────
  const createResult = await deps.apInvoiceRepo.create({
    tenantId: input.tenantId,
    companyId: input.companyId,
    supplierId: input.supplierId,
    ledgerId: input.ledgerId,
    invoiceNumber: input.noteNumber,
    supplierRef: null,
    invoiceDate: noteDate,
    dueDate,
    currencyCode: input.currencyCode,
    description: input.reason,
    poRef: input.poRef ?? null,
    receiptRef: null,
    paymentTermsId: null,
    invoiceType: DOCUMENT_TYPE_MAP[input.documentType],
    originalInvoiceId: input.originalInvoiceId,
    lines: [
      {
        accountId: firstLineAccountId,
        description: input.reason,
        quantity: 1,
        unitPrice: signedAmount,
        amount: signedAmount,
        taxAmount: 0n,
      },
    ],
  });

  if (!createResult.ok) {
    return err(new AppError('INTERNAL', createResult.error.message));
  }

  return ok({
    id: createResult.value.id,
    invoiceType: DOCUMENT_TYPE_MAP[input.documentType],
    status: createResult.value.status,
    noteNumber: input.noteNumber,
    originalInvoiceId: input.originalInvoiceId,
  });
}
