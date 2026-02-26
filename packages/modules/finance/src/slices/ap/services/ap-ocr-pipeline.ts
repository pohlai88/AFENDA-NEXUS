import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo, CreateApInvoiceInput } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import { FinanceEventType } from '../../../shared/events.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OcrConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OcrInvoicePayload {
  readonly tenantId: string;
  readonly provider: string;
  readonly externalRef: string;
  readonly confidence: OcrConfidence;
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
  readonly lines: readonly OcrInvoiceLine[];
  readonly rawPayload?: Record<string, unknown>;
}

export interface OcrInvoiceLine {
  readonly accountId: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unitPrice: bigint;
  readonly amount: bigint;
  readonly taxAmount: bigint;
  readonly whtIncomeType?: string | null;
}

export interface OcrInvoiceResult {
  readonly invoice: ApInvoice;
  readonly initialStatus: 'DRAFT' | 'INCOMPLETE';
  readonly confidence: OcrConfidence;
  readonly provider: string;
  readonly externalRef: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

/**
 * B3: OCR/Automation webhook receiver.
 *
 * Accepts an OCR-extracted invoice payload from an external provider,
 * validates the structure, and creates a DRAFT or INCOMPLETE invoice
 * depending on confidence level.
 *
 * - HIGH confidence → DRAFT (ready for approval flow)
 * - MEDIUM/LOW confidence → INCOMPLETE (enters triage queue)
 *
 * Uses idempotency guard keyed on `provider:externalRef` to prevent
 * duplicate processing of the same OCR result.
 */
export async function processOcrInvoice(
  input: OcrInvoicePayload,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
    idempotencyStore?: IIdempotencyStore;
  }
): Promise<Result<OcrInvoiceResult>> {
  // Validate required fields
  if (!input.invoiceNumber?.trim()) {
    return err(new AppError('VALIDATION', 'OCR payload missing invoiceNumber'));
  }
  if (input.lines.length === 0) {
    return err(new AppError('VALIDATION', 'OCR payload has no invoice lines'));
  }
  if (!input.externalRef?.trim()) {
    return err(new AppError('VALIDATION', 'OCR payload missing externalRef'));
  }

  // Idempotency guard — keyed on provider + externalRef
  if (deps.idempotencyStore) {
    const idempotencyKey = `OCR_${input.provider}_${input.externalRef}`;
    const claim = await deps.idempotencyStore.claimOrGet({
      tenantId: input.tenantId,
      key: idempotencyKey,
      commandType: 'OCR_INVOICE',
    });
    if (!claim.claimed) {
      return err(
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          `OCR invoice ${input.provider}:${input.externalRef} already processed`
        )
      );
    }
  }

  const initialStatus = input.confidence === 'HIGH' ? 'DRAFT' : 'INCOMPLETE';

  const createInput: CreateApInvoiceInput = {
    tenantId: input.tenantId,
    companyId: input.companyId,
    supplierId: input.supplierId,
    ledgerId: input.ledgerId,
    invoiceNumber: input.invoiceNumber,
    supplierRef: input.supplierRef,
    invoiceDate: new Date(input.invoiceDate),
    dueDate: new Date(input.dueDate),
    currencyCode: input.currencyCode,
    description: input.description,
    poRef: input.poRef,
    receiptRef: input.receiptRef,
    paymentTermsId: null,
    lines: input.lines.map((l) => ({
      accountId: l.accountId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: l.amount,
      taxAmount: l.taxAmount,
      whtIncomeType: l.whtIncomeType ?? null,
    })),
  };

  const created = await deps.apInvoiceRepo.create(createInput);
  if (!created.ok) return created as Result<never>;

  // If confidence is not HIGH, mark as INCOMPLETE so it enters triage
  if (initialStatus === 'INCOMPLETE') {
    const statusUpdate = await deps.apInvoiceRepo.updateStatus(created.value.id, 'INCOMPLETE');
    if (!statusUpdate.ok) return statusUpdate as Result<never>;
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_OCR_INVOICE_RECEIVED,
    payload: {
      invoiceId: created.value.id,
      provider: input.provider,
      externalRef: input.externalRef,
      confidence: input.confidence,
      initialStatus,
      invoiceNumber: input.invoiceNumber,
    },
  });

  if (deps.idempotencyStore) {
    await deps.idempotencyStore.recordOutcome?.(
      input.tenantId,
      `OCR_${input.provider}_${input.externalRef}`,
      'OCR_INVOICE',
      created.value.id
    );
  }

  return ok({
    invoice: created.value,
    initialStatus,
    confidence: input.confidence,
    provider: input.provider,
    externalRef: input.externalRef,
  });
}
