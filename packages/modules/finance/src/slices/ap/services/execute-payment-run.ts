import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { PaymentRun } from '../entities/payment-run.js';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IApprovalWorkflow } from '../../../shared/ports/approval-workflow.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface ExecutePaymentRunInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly paymentRunId: string;
  readonly correlationId?: string;
}

export async function executePaymentRun(
  input: ExecutePaymentRunInput,
  deps: {
    apPaymentRunRepo: IApPaymentRunRepo;
    apInvoiceRepo: IApInvoiceRepo;
    outboxWriter: IOutboxWriter;
    approvalWorkflow?: IApprovalWorkflow;
  },
  ctx?: FinanceContext
): Promise<Result<PaymentRun>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const found = await deps.apPaymentRunRepo.findById(input.paymentRunId);
  if (!found.ok) return found;

  const run = found.value;

  if (run.status !== 'APPROVED') {
    return err(
      new AppError(
        'VALIDATION',
        `Payment run must be APPROVED to execute, current status: ${run.status}`
      )
    );
  }

  // GAP-A2: Approval workflow integration — opt-in
  if (deps.approvalWorkflow) {
    const approved = await deps.approvalWorkflow.isApproved(tenantId, 'payment_run', run.id);
    if (!approved) {
      // Submit for approval if not already
      const submitResult = await deps.approvalWorkflow.submit({
        tenantId,
        entityType: 'payment_run',
        entityId: run.id,
        requestedBy: userId,
        metadata: {
          totalAmount: run.totalAmount.amount.toString(),
          itemCount: String(run.items.length),
          runNumber: run.runNumber,
        },
      });
      if (!submitResult.ok) return submitResult as Result<never>;
      if (submitResult.value.status === 'PENDING') {
        return err(
          new AppError('INVALID_STATE', `Payment run ${run.id} requires approval before execution`)
        );
      }
    }
  }

  if (run.items.length === 0) {
    return err(new AppError('VALIDATION', 'Payment run has no items'));
  }

  // Record payment against each invoice
  for (const item of run.items) {
    const payResult = await deps.apInvoiceRepo.recordPayment(item.invoiceId, item.netAmount.amount);
    if (!payResult.ok) return payResult as Result<never>;
  }

  // Execute the run
  const executed = await deps.apPaymentRunRepo.execute(input.paymentRunId, userId);
  if (!executed.ok) return executed;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AP_PAYMENT_RUN_EXECUTED,
    payload: {
      paymentRunId: run.id,
      runNumber: run.runNumber,
      itemCount: run.items.length,
      totalAmount: run.totalAmount.amount.toString(),
      userId,
      correlationId: input.correlationId,
    },
  });

  return executed;
}
