import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface CancelApInvoiceInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly reason: string;
  readonly correlationId?: string;
}

export async function cancelApInvoice(
  input: CancelApInvoiceInput,
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
    const idempotencyKey = input.correlationId ?? `CANCEL_${input.invoiceId}`;
    const claim = await deps.idempotencyStore.claimOrGet({
      tenantId,
      key: idempotencyKey,
      commandType: 'CANCEL_AP_INVOICE',
    });
    if (!claim.claimed) {
      return err(
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          `Cancellation for invoice ${input.invoiceId} already processed`
        )
      );
    }
  }

  const found = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found;

  const invoice = found.value;

  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
    return err(new AppError('VALIDATION', `Cannot cancel invoice with status: ${invoice.status}`));
  }

  if (invoice.paidAmount.amount > 0n) {
    return err(
      new AppError(
        'VALIDATION',
        'Cannot cancel invoice with partial payments — reverse payments first'
      )
    );
  }

  const updated = await deps.apInvoiceRepo.updateStatus(invoice.id, 'CANCELLED');
  if (!updated.ok) return updated;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AP_INVOICE_CANCELLED,
    payload: {
      invoiceId: invoice.id,
      supplierId: invoice.supplierId,
      totalAmount: invoice.totalAmount.amount.toString(),
      reason: input.reason,
      userId,
      correlationId: input.correlationId,
    },
  });

  if (deps.idempotencyStore) {
    const idempotencyKey = input.correlationId ?? `CANCEL_${input.invoiceId}`;
    await deps.idempotencyStore.recordOutcome?.(
      tenantId,
      idempotencyKey,
      'CANCEL_AP_INVOICE',
      invoice.id
    );
  }

  return updated;
}
