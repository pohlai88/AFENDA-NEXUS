import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ArInvoice } from '../entities/ar-invoice.js';
import type { IArInvoiceRepo } from '../ports/ar-invoice-repo.js';
import type { IJournalRepo } from '../../../shared/ports/journal-posting-port.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IDocumentNumberGenerator } from '../../../shared/ports/journal-posting-port.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface PostArInvoiceInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly fiscalPeriodId: string;
  readonly arAccountId: string;
  readonly correlationId?: string;
}

export async function postArInvoice(
  input: PostArInvoiceInput,
  deps: {
    arInvoiceRepo: IArInvoiceRepo;
    journalRepo: IJournalRepo;
    outboxWriter: IOutboxWriter;
    documentNumberGenerator: IDocumentNumberGenerator;
  },
  ctx?: FinanceContext
): Promise<Result<ArInvoice>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const found = await deps.arInvoiceRepo.findById(input.invoiceId);
  if (!found.ok) return found;

  const invoice = found.value;

  if (invoice.status !== 'APPROVED') {
    return err(
      new AppError(
        'VALIDATION',
        `Invoice must be APPROVED to post, current status: ${invoice.status}`
      )
    );
  }

  const numResult = await deps.documentNumberGenerator.next(tenantId, 'AR');
  if (!numResult.ok) return numResult as Result<never>;
  const journalNumber = numResult.value;

  // Build GL journal lines: debit AR control account, credit revenue accounts (from lines)
  const revenueLines = invoice.lines.map((line, idx) => ({
    accountId: line.accountId,
    debit: 0n,
    credit: line.amount.amount + line.taxAmount.amount,
    description: line.description ?? `AR Invoice ${invoice.invoiceNumber} line ${idx + 1}`,
  }));

  const arControlLine = {
    accountId: input.arAccountId,
    debit: invoice.totalAmount.amount,
    credit: 0n,
    description: `AR Invoice ${invoice.invoiceNumber}`,
  };

  const journalResult = await deps.journalRepo.create({
    tenantId,
    ledgerId: invoice.ledgerId as string,
    fiscalPeriodId: input.fiscalPeriodId,
    journalNumber,
    description: `AR Invoice ${invoice.invoiceNumber} - ${invoice.description ?? ''}`,
    postingDate: invoice.invoiceDate,
    lines: [arControlLine, ...revenueLines],
  });

  if (!journalResult.ok) return journalResult as Result<never>;

  const updated = await deps.arInvoiceRepo.updateStatus(
    invoice.id,
    'POSTED',
    journalResult.value.id
  );

  if (!updated.ok) return updated;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AR_INVOICE_POSTED,
    payload: {
      invoiceId: invoice.id,
      journalId: journalResult.value.id,
      customerId: invoice.customerId,
      totalAmount: invoice.totalAmount.amount.toString(),
      userId,
      correlationId: input.correlationId,
    },
  });

  return updated;
}
