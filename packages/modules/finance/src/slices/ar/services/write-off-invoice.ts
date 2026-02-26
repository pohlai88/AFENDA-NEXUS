import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ArInvoice } from '../entities/ar-invoice.js';
import type { IArInvoiceRepo } from '../ports/ar-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface WriteOffInvoiceInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly reason: string;
  readonly correlationId?: string;
}

export async function writeOffInvoice(
  input: WriteOffInvoiceInput,
  deps: {
    arInvoiceRepo: IArInvoiceRepo;
    outboxWriter: IOutboxWriter;
  },
  ctx?: FinanceContext
): Promise<Result<ArInvoice>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const found = await deps.arInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found;

  const invoice = found.value;

  const allowedStatuses: ArInvoice['status'][] = ['POSTED', 'PARTIALLY_PAID'];
  if (!allowedStatuses.includes(invoice.status)) {
    return err(
      new AppError('VALIDATION', `Cannot write off invoice with status: ${invoice.status}`)
    );
  }

  const written = await deps.arInvoiceRepo.writeOff(invoice.id);
  if (!written.ok) return written;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AR_WRITE_OFF_APPROVED,
    payload: {
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      outstandingAmount: (invoice.totalAmount.amount - invoice.paidAmount.amount).toString(),
      reason: input.reason,
      userId,
      correlationId: input.correlationId,
    },
  });

  return written;
}
