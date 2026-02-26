import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { PaymentRun } from '../entities/payment-run.js';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface ReversePaymentRunInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly paymentRunId: string;
  readonly reason: string;
  readonly correlationId?: string;
}

export interface ReversePaymentRunDeps {
  readonly apPaymentRunRepo: IApPaymentRunRepo;
  readonly apInvoiceRepo: IApInvoiceRepo;
  readonly outboxWriter: IOutboxWriter;
  readonly idempotencyStore: IIdempotencyStore;
}

export interface PaymentReversalResult {
  readonly paymentRun: PaymentRun;
  readonly reopenedInvoiceIds: readonly string[];
  readonly reason: string;
}

export async function reversePaymentRun(
  input: ReversePaymentRunInput,
  deps: ReversePaymentRunDeps
): Promise<Result<PaymentReversalResult>> {
  // Idempotency guard
  const idempotencyKey = `REVERSE_${input.correlationId ?? input.paymentRunId}`;
  const claim = await deps.idempotencyStore.claimOrGet({
    tenantId: input.tenantId,
    key: idempotencyKey,
    commandType: 'REVERSE_PAYMENT_RUN',
  });
  if (!claim.claimed) {
    return err(
      new AppError(
        'IDEMPOTENCY_CONFLICT',
        `Payment run reversal ${input.paymentRunId} already processed`
      )
    );
  }

  // Load the payment run
  const found = await deps.apPaymentRunRepo.findById(input.paymentRunId);
  if (!found.ok) return found;

  const run = found.value;

  if (run.status !== 'EXECUTED') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Payment run must be EXECUTED to reverse, current status: ${run.status}`
      )
    );
  }

  // Reverse each item: negate the payment against each invoice
  const reopenedInvoiceIds: string[] = [];
  for (const item of run.items) {
    const negatedAmount = -item.netAmount.amount;
    const reverseResult = await deps.apInvoiceRepo.recordPayment(item.invoiceId, negatedAmount);
    if (!reverseResult.ok) return reverseResult as Result<never>;
    reopenedInvoiceIds.push(item.invoiceId);
  }

  // Mark payment run as CANCELLED
  const updated = await deps.apPaymentRunRepo.updateStatus(input.paymentRunId, 'CANCELLED');
  if (!updated.ok) return updated as Result<never>;

  // Emit reversal event
  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_PAYMENT_RUN_REVERSED,
    payload: {
      paymentRunId: run.id,
      runNumber: run.runNumber,
      itemCount: run.items.length,
      totalAmount: run.totalAmount.amount.toString(),
      reason: input.reason,
      reopenedInvoiceIds,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  await deps.idempotencyStore.recordOutcome?.(
    input.tenantId,
    idempotencyKey,
    'REVERSE_PAYMENT_RUN',
    run.id
  );

  return {
    ok: true,
    value: {
      paymentRun: updated.value,
      reopenedInvoiceIds,
      reason: input.reason,
    },
  };
}
