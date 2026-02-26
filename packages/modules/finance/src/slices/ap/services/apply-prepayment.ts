import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { PrepaymentApplication } from '../entities/prepayment.js';
import type { IApPrepaymentRepo } from '../ports/prepayment-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface ApplyPrepaymentInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly prepaymentId: string;
  readonly targetInvoiceId: string;
  readonly amount: bigint;
  readonly correlationId?: string;
}

/**
 * W4-2: Apply a prepayment against a target invoice.
 *
 * Validates the prepayment has sufficient unapplied balance,
 * the target invoice exists and is payable, then records the application
 * and reduces the invoice's outstanding balance.
 */
export async function applyPrepayment(
  input: ApplyPrepaymentInput,
  deps: {
    prepaymentRepo: IApPrepaymentRepo;
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
    idempotencyStore?: IIdempotencyStore;
  }
): Promise<Result<PrepaymentApplication>> {
  if (deps.idempotencyStore) {
    const idempotencyKey =
      input.correlationId ?? `PREPAY_${input.prepaymentId}_${input.targetInvoiceId}`;
    const claim = await deps.idempotencyStore.claimOrGet({
      tenantId: input.tenantId,
      key: idempotencyKey,
      commandType: 'APPLY_PREPAYMENT',
    });
    if (!claim.claimed) {
      return err(
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          `Prepayment application ${input.prepaymentId} already processed`
        )
      );
    }
  }

  const prepayment = await deps.prepaymentRepo.findById(input.prepaymentId);
  if (!prepayment.ok) return prepayment as Result<never>;

  if (prepayment.value.status === 'FULLY_APPLIED' || prepayment.value.status === 'CANCELLED') {
    return err(
      new AppError(
        'INVALID_STATE',
        `Prepayment ${input.prepaymentId} is ${prepayment.value.status}`
      )
    );
  }

  if (input.amount > prepayment.value.unappliedBalance.amount) {
    return err(
      new AppError(
        'VALIDATION',
        `Application amount ${input.amount} exceeds unapplied balance ${prepayment.value.unappliedBalance.amount}`
      )
    );
  }

  const invoice = await deps.apInvoiceRepo.findById(input.targetInvoiceId);
  if (!invoice.ok) return invoice as Result<never>;

  const inv = invoice.value;
  if (inv.status === 'CANCELLED' || inv.status === 'DRAFT' || inv.status === 'PAID') {
    return err(
      new AppError('VALIDATION', `Cannot apply prepayment to invoice with status: ${inv.status}`)
    );
  }

  const outstanding = inv.totalAmount.amount - inv.paidAmount.amount;
  if (input.amount > outstanding) {
    return err(
      new AppError(
        'VALIDATION',
        `Application amount ${input.amount} exceeds invoice outstanding ${outstanding}`
      )
    );
  }

  const application = await deps.prepaymentRepo.applyToInvoice({
    prepaymentId: input.prepaymentId,
    targetInvoiceId: input.targetInvoiceId,
    amount: input.amount,
    appliedBy: input.userId,
  });
  if (!application.ok) return application;

  const payResult = await deps.apInvoiceRepo.recordPayment(input.targetInvoiceId, input.amount);
  if (!payResult.ok) return payResult as Result<never>;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.AP_PREPAYMENT_APPLIED,
    payload: {
      prepaymentId: input.prepaymentId,
      targetInvoiceId: input.targetInvoiceId,
      amount: input.amount.toString(),
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  if (deps.idempotencyStore && application.ok) {
    const idempotencyKey =
      input.correlationId ?? `PREPAY_${input.prepaymentId}_${input.targetInvoiceId}`;
    await deps.idempotencyStore.recordOutcome?.(
      input.tenantId,
      idempotencyKey,
      'APPLY_PREPAYMENT',
      application.value.id
    );
  }

  return application;
}
