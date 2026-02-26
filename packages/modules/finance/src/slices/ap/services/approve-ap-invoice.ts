import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IApHoldRepo } from '../ports/ap-hold-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface ApproveApInvoiceInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly correlationId?: string;
}

export async function approveApInvoice(
  input: ApproveApInvoiceInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    apHoldRepo?: IApHoldRepo;
    outboxWriter: IOutboxWriter;
    idempotencyStore?: IIdempotencyStore;
  },
  ctx?: FinanceContext
): Promise<Result<ApInvoice>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  if (deps.idempotencyStore) {
    const idempotencyKey = input.correlationId ?? `APPROVE_${input.invoiceId}`;
    const claim = await deps.idempotencyStore.claimOrGet({
      tenantId,
      key: idempotencyKey,
      commandType: 'APPROVE_AP_INVOICE',
    });
    if (!claim.claimed) {
      return err(
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          `Approval for invoice ${input.invoiceId} already processed`
        )
      );
    }
  }

  const found = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found;

  const invoice = found.value;

  if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING_APPROVAL') {
    return err(
      new AppError(
        'VALIDATION',
        `Invoice must be DRAFT or PENDING_APPROVAL to approve, current status: ${invoice.status}`
      )
    );
  }

  // W2-2: Block approval if invoice has active holds (duplicate, match exception, etc.)
  if (deps.apHoldRepo) {
    const hasHolds = await deps.apHoldRepo.hasActiveHolds(invoice.id);
    if (hasHolds) {
      return err(
        new AppError(
          'AP_INVOICE_HAS_ACTIVE_HOLDS',
          `Invoice ${invoice.id} has active holds — release all holds before approving`
        )
      );
    }
  }

  const updated = await deps.apInvoiceRepo.updateStatus(invoice.id, 'APPROVED');
  if (!updated.ok) return updated;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AP_INVOICE_APPROVED,
    payload: {
      invoiceId: invoice.id,
      supplierId: invoice.supplierId,
      totalAmount: invoice.totalAmount.amount.toString(),
      userId,
      correlationId: input.correlationId,
    },
  });

  if (deps.idempotencyStore) {
    const idempotencyKey = input.correlationId ?? `APPROVE_${input.invoiceId}`;
    await deps.idempotencyStore.recordOutcome?.(
      tenantId,
      idempotencyKey,
      'APPROVE_AP_INVOICE',
      invoice.id
    );
  }

  return updated;
}
