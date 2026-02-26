import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface BankRejectionInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly paymentRunId: string;
  readonly rejectionCode: string;
  readonly rejectionReason: string;
  readonly rejectedItemIds?: readonly string[];
  readonly correlationId?: string;
}

export interface BankRejectionResult {
  readonly paymentRunId: string;
  readonly rejectedItemCount: number;
  readonly reopenedInvoiceIds: readonly string[];
  readonly rejectionCode: string;
  readonly rejectionReason: string;
}

/**
 * W4-5: Bank rejection feedback.
 *
 * Processes a bank rejection for a payment run (or specific items).
 * Reverses the affected payment allocations and reopens the invoices
 * so they return to the payable pool.
 *
 * If `rejectedItemIds` is specified, only those items are reversed (partial rejection).
 * If omitted, all items in the payment run are reversed (full rejection).
 */
export async function processBankRejection(
  input: BankRejectionInput,
  deps: {
    apPaymentRunRepo: IApPaymentRunRepo;
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
    idempotencyStore?: IIdempotencyStore;
  }
): Promise<Result<BankRejectionResult>> {
  if (deps.idempotencyStore) {
    const idempotencyKey = input.correlationId ?? `BANK_REJ_${input.paymentRunId}`;
    const claim = await deps.idempotencyStore.claimOrGet({
      tenantId: input.tenantId,
      key: idempotencyKey,
      commandType: 'BANK_REJECTION',
    });
    if (!claim.claimed) {
      return err(
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          `Bank rejection for ${input.paymentRunId} already processed`
        )
      );
    }
  }

  const found = await deps.apPaymentRunRepo.findById(input.paymentRunId);
  if (!found.ok) return found as Result<never>;

  const run = found.value;

  if (run.status !== 'EXECUTED') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Payment run must be EXECUTED to process rejection, current status: ${run.status}`
      )
    );
  }

  const itemsToReject = input.rejectedItemIds
    ? run.items.filter((item) => input.rejectedItemIds!.includes(item.id))
    : run.items;

  if (itemsToReject.length === 0) {
    return err(new AppError('VALIDATION', 'No matching items found for rejection'));
  }

  const reopenedInvoiceIds: string[] = [];

  for (const item of itemsToReject) {
    const negatedAmount = -item.netAmount.amount;
    const reverseResult = await deps.apInvoiceRepo.recordPayment(item.invoiceId, negatedAmount);
    if (!reverseResult.ok) return reverseResult as Result<never>;
    reopenedInvoiceIds.push(item.invoiceId);
  }

  // If all items rejected, mark payment run as CANCELLED
  if (itemsToReject.length === run.items.length) {
    const updated = await deps.apPaymentRunRepo.updateStatus(input.paymentRunId, 'CANCELLED');
    if (!updated.ok) return updated as Result<never>;
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_BANK_REJECTION_PROCESSED,
    payload: {
      paymentRunId: input.paymentRunId,
      rejectionCode: input.rejectionCode,
      rejectionReason: input.rejectionReason,
      rejectedItemCount: itemsToReject.length,
      totalItemCount: run.items.length,
      reopenedInvoiceIds,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  const result: BankRejectionResult = {
    paymentRunId: input.paymentRunId,
    rejectedItemCount: itemsToReject.length,
    reopenedInvoiceIds,
    rejectionCode: input.rejectionCode,
    rejectionReason: input.rejectionReason,
  };

  if (deps.idempotencyStore) {
    const idempotencyKey = input.correlationId ?? `BANK_REJ_${input.paymentRunId}`;
    await deps.idempotencyStore.recordOutcome?.(
      input.tenantId,
      idempotencyKey,
      'BANK_REJECTION',
      input.paymentRunId
    );
  }

  return ok(result);
}
