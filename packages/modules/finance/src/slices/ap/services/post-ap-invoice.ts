import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IJournalRepo } from '../../../shared/ports/journal-posting-port.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IDocumentNumberGenerator } from '../../../shared/ports/journal-posting-port.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import type { IFiscalPeriodRepo } from '../../gl/ports/fiscal-period-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface PostApInvoiceInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly invoiceId: string;
  readonly fiscalPeriodId: string;
  readonly apAccountId: string;
  readonly correlationId?: string;
}

export async function postApInvoice(
  input: PostApInvoiceInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    journalRepo: IJournalRepo;
    outboxWriter: IOutboxWriter;
    documentNumberGenerator: IDocumentNumberGenerator;
    idempotencyStore: IIdempotencyStore;
    fiscalPeriodRepo?: IFiscalPeriodRepo;
  },
  ctx?: FinanceContext
): Promise<Result<ApInvoice>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const idempotencyKey = input.correlationId ?? input.invoiceId;
  const claim = await deps.idempotencyStore.claimOrGet({
    tenantId,
    key: idempotencyKey,
    commandType: 'POST_AP_INVOICE',
  });
  if (!claim.claimed) {
    return err(
      new AppError('IDEMPOTENCY_CONFLICT', `AP invoice ${input.invoiceId} already posted`)
    );
  }

  const found = await deps.apInvoiceRepo.findById(input.invoiceId);
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

  // W2-7: Period control check — reject posting into closed/locked periods
  if (deps.fiscalPeriodRepo) {
    const periodResult = await deps.fiscalPeriodRepo.findById(input.fiscalPeriodId);
    if (!periodResult.ok) return periodResult as Result<never>;
    const period = periodResult.value;
    if (period.status !== 'OPEN') {
      return err(
        new AppError(
          'AP_PERIOD_CLOSED',
          `Cannot post to fiscal period "${period.name}" — status is ${period.status}`
        )
      );
    }
  }

  const numResult = await deps.documentNumberGenerator.next(tenantId, 'AP');
  if (!numResult.ok) return numResult as Result<never>;
  const journalNumber = numResult.value;

  // Build GL journal lines: debit expense accounts (from lines), credit AP control account
  const expenseLines = invoice.lines.map((line, idx) => ({
    accountId: line.accountId,
    debit: line.amount.amount + line.taxAmount.amount,
    credit: 0n,
    description: line.description ?? `AP Invoice ${invoice.invoiceNumber} line ${idx + 1}`,
  }));

  const apControlLine = {
    accountId: input.apAccountId,
    debit: 0n,
    credit: invoice.totalAmount.amount,
    description: `AP Invoice ${invoice.invoiceNumber}`,
  };

  const journalResult = await deps.journalRepo.create({
    tenantId,
    ledgerId: invoice.ledgerId as string,
    fiscalPeriodId: input.fiscalPeriodId,
    journalNumber,
    description: `AP Invoice ${invoice.invoiceNumber} - ${invoice.description ?? ''}`,
    postingDate: invoice.invoiceDate,
    lines: [...expenseLines, apControlLine],
  });

  if (!journalResult.ok) return journalResult as Result<never>;

  const updated = await deps.apInvoiceRepo.updateStatus(
    invoice.id,
    'POSTED',
    journalResult.value.id
  );

  if (!updated.ok) return updated;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AP_INVOICE_POSTED,
    payload: {
      invoiceId: invoice.id,
      journalId: journalResult.value.id,
      supplierId: invoice.supplierId,
      totalAmount: invoice.totalAmount.amount.toString(),
      userId,
      correlationId: input.correlationId,
    },
  });

  await deps.idempotencyStore.recordOutcome?.(
    tenantId,
    idempotencyKey,
    'POST_AP_INVOICE',
    invoice.id
  );

  return updated;
}
