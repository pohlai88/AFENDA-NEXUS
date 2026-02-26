import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo, CreateApInvoiceInput } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface CreateDebitMemoInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly originalInvoiceId: string;
  readonly reason: string;
  readonly correlationId?: string;
}

/**
 * AP-08: Debit memo / credit note (negative invoice).
 * Creates a debit memo that offsets an existing AP invoice.
 */
export async function createDebitMemo(
  input: CreateDebitMemoInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
  },
  ctx?: FinanceContext
): Promise<Result<ApInvoice>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const found = await deps.apInvoiceRepo.findById(input.originalInvoiceId);
  if (!found.ok) return found;

  const original = found.value;

  if (original.status === 'CANCELLED' || original.status === 'DRAFT') {
    return err(
      new AppError(
        'VALIDATION',
        `Cannot create debit memo for invoice with status: ${original.status}`
      )
    );
  }

  // Create negative invoice (debit memo) with reversed line amounts
  const memoLines = original.lines.map((line) => ({
    accountId: line.accountId,
    description: `Debit memo for ${original.invoiceNumber}: ${input.reason}`,
    quantity: line.quantity,
    unitPrice: -line.unitPrice.amount,
    amount: -line.amount.amount,
    taxAmount: -line.taxAmount.amount,
  }));

  const memoInput: CreateApInvoiceInput = {
    tenantId,
    companyId: original.companyId as string,
    supplierId: original.supplierId,
    ledgerId: original.ledgerId as string,
    invoiceNumber: `DM-${original.invoiceNumber}`,
    supplierRef: original.supplierRef,
    invoiceDate: new Date(),
    dueDate: new Date(),
    currencyCode: original.totalAmount.currency,
    description: `Debit memo for ${original.invoiceNumber}: ${input.reason}`,
    poRef: original.poRef,
    receiptRef: original.receiptRef,
    paymentTermsId: null,
    lines: memoLines,
  };

  const created = await deps.apInvoiceRepo.create(memoInput);
  if (!created.ok) return created;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AP_DEBIT_MEMO_CREATED,
    payload: {
      debitMemoId: created.value.id,
      originalInvoiceId: original.id,
      reason: input.reason,
      userId,
      correlationId: input.correlationId,
    },
  });

  return created;
}
