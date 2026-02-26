import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo, CreateApInvoiceInput } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface CreateCreditMemoInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly originalInvoiceId: string;
  readonly reason: string;
  readonly correlationId?: string;
}

/**
 * W4-1: Credit memo invoice type.
 *
 * Creates a credit memo that offsets an existing AP invoice with positive offset
 * semantics. Unlike a debit memo (which creates negative lines), a credit memo
 * reduces the supplier's receivable from us — it is a positive document that
 * decreases the AP balance.
 *
 * The credit memo is linked to the original via `originalInvoiceId` and has
 * `invoiceType: 'CREDIT_MEMO'`. Line amounts are positive (representing the
 * credit to our account).
 */
export async function createCreditMemo(
  input: CreateCreditMemoInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
    idempotencyStore?: IIdempotencyStore;
  },
  ctx?: FinanceContext
): Promise<Result<ApInvoice>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  if (deps.idempotencyStore) {
    const idempotencyKey = input.correlationId ?? `CM_${input.originalInvoiceId}`;
    const claim = await deps.idempotencyStore.claimOrGet({
      tenantId,
      key: idempotencyKey,
      commandType: 'CREATE_CREDIT_MEMO',
    });
    if (!claim.claimed) {
      return err(
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          `Credit memo for invoice ${input.originalInvoiceId} already processed`
        )
      );
    }
  }

  const found = await deps.apInvoiceRepo.findById(input.originalInvoiceId);
  if (!found.ok) return found;

  const original = found.value;

  if (original.status === 'CANCELLED' || original.status === 'DRAFT') {
    return err(
      new AppError(
        'VALIDATION',
        `Cannot create credit memo for invoice with status: ${original.status}`
      )
    );
  }

  if (original.invoiceType === 'CREDIT_MEMO') {
    return err(new AppError('VALIDATION', 'Cannot create credit memo against another credit memo'));
  }

  // Credit memo lines mirror the original but represent positive offset amounts
  const creditLines = original.lines.map((line) => ({
    accountId: line.accountId,
    description: `Credit memo for ${original.invoiceNumber}: ${input.reason}`,
    quantity: line.quantity,
    unitPrice: line.unitPrice.amount,
    amount: line.amount.amount,
    taxAmount: line.taxAmount.amount,
  }));

  const memoInput: CreateApInvoiceInput = {
    tenantId,
    companyId: original.companyId as string,
    supplierId: original.supplierId,
    ledgerId: original.ledgerId as string,
    invoiceNumber: `CM-${original.invoiceNumber}`,
    supplierRef: original.supplierRef,
    invoiceDate: new Date(),
    dueDate: new Date(),
    currencyCode: original.totalAmount.currency,
    description: `Credit memo for ${original.invoiceNumber}: ${input.reason}`,
    poRef: original.poRef,
    receiptRef: original.receiptRef,
    paymentTermsId: null,
    lines: creditLines,
  };

  const created = await deps.apInvoiceRepo.create(memoInput);
  if (!created.ok) return created;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AP_CREDIT_MEMO_CREATED,
    payload: {
      creditMemoId: created.value.id,
      originalInvoiceId: original.id,
      reason: input.reason,
      userId,
      correlationId: input.correlationId,
    },
  });

  if (deps.idempotencyStore) {
    const idempotencyKey = input.correlationId ?? `CM_${input.originalInvoiceId}`;
    await deps.idempotencyStore.recordOutcome?.(
      tenantId,
      idempotencyKey,
      'CREATE_CREDIT_MEMO',
      created.value.id
    );
  }

  return created;
}
