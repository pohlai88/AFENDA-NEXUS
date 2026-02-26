import type { Result } from '@afenda/core';
import { err, AppError } from '@afenda/core';
import type { PaymentRun } from '../entities/payment-run.js';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IIdempotencyStore } from '../../../shared/ports/idempotency-store.js';
import type { IApprovalWorkflow } from '../../../shared/ports/approval-workflow.js';
import { computeWht } from '../calculators/wht-calculator.js';
import type { WhtRate, WhtResult } from '../calculators/wht-calculator.js';
import type { ITransactionScope } from '../../../shared/ports/transaction-scope.js';
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
    supplierRepo?: ISupplierRepo;
    outboxWriter: IOutboxWriter;
    idempotencyStore: IIdempotencyStore;
    approvalWorkflow?: IApprovalWorkflow;
    transactionScope?: ITransactionScope;
    resolveWhtRate?: (whtRateId: string) => Promise<WhtRate | null>;
  },
  ctx?: FinanceContext
): Promise<Result<PaymentRun>> {
  const tenantId = ctx?.tenantId ?? input.tenantId;
  const userId = ctx?.actor.userId ?? input.userId;

  const idempotencyKey = input.correlationId ?? input.paymentRunId;
  const claim = await deps.idempotencyStore.claimOrGet({
    tenantId,
    key: idempotencyKey,
    commandType: 'EXECUTE_PAYMENT_RUN',
  });
  if (!claim.claimed) {
    return err(
      new AppError('IDEMPOTENCY_CONFLICT', `Payment run ${input.paymentRunId} already processed`)
    );
  }

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

  // W3-9: Record payments + execute inside a transaction boundary (if available)
  const whtDetails: Array<{ invoiceId: string; wht: WhtResult }> = [];

  const executeCore = async (): Promise<Result<PaymentRun>> => {
    for (const item of run.items) {
      let paymentAmount = item.netAmount.amount;

      // W2-3: Compute WHT if supplier has a WHT profile
      if (deps.supplierRepo && deps.resolveWhtRate) {
        const supplierResult = await deps.supplierRepo.findById(item.supplierId);
        if (supplierResult.ok && supplierResult.value.whtRateId) {
          const whtRate = await deps.resolveWhtRate(supplierResult.value.whtRateId);
          if (whtRate) {
            const wht = computeWht(item.netAmount.amount, whtRate);
            paymentAmount = wht.netPayable;
            whtDetails.push({ invoiceId: item.invoiceId, wht });
          }
        }
      }

      const payResult = await deps.apInvoiceRepo.recordPayment(item.invoiceId, paymentAmount);
      if (!payResult.ok) return payResult as Result<never>;
    }

    return deps.apPaymentRunRepo.execute(input.paymentRunId, userId);
  };

  const executed = deps.transactionScope
    ? await deps.transactionScope.runInTransaction(executeCore)
    : await executeCore();
  if (!executed.ok) return executed;

  await deps.outboxWriter.write({
    tenantId,
    eventType: FinanceEventType.AP_PAYMENT_RUN_EXECUTED,
    payload: {
      paymentRunId: run.id,
      runNumber: run.runNumber,
      itemCount: run.items.length,
      totalAmount: run.totalAmount.amount.toString(),
      whtItemCount: whtDetails.length,
      userId,
      correlationId: input.correlationId,
    },
  });

  await deps.idempotencyStore.recordOutcome?.(
    tenantId,
    idempotencyKey,
    'EXECUTE_PAYMENT_RUN',
    executed.value.id
  );

  return executed;
}
