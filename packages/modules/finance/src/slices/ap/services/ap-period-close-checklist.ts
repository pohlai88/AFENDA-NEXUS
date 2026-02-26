import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IApHoldRepo } from '../ports/ap-hold-repo.js';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

/**
 * W3-2: AP period close checklist.
 *
 * Queries open holds, unmatched invoices, and unpaid items.
 * Returns a checklist of exceptions that must be resolved before closing.
 * If any blocking exceptions exist, the checklist indicates close is blocked.
 */

export interface ApPeriodCloseChecklistInput {
  readonly tenantId: string;
  readonly userId: string;
}

export interface ApCloseException {
  readonly category: 'OPEN_HOLD' | 'UNMATCHED_INVOICE' | 'UNPAID_POSTED' | 'DRAFT_PAYMENT_RUN';
  readonly entityId: string;
  readonly description: string;
  readonly blocking: boolean;
}

export interface ApPeriodCloseChecklist {
  readonly canClose: boolean;
  readonly exceptions: readonly ApCloseException[];
  readonly summary: {
    readonly openHoldCount: number;
    readonly unmatchedInvoiceCount: number;
    readonly unpaidPostedCount: number;
    readonly draftPaymentRunCount: number;
    readonly totalBlockingCount: number;
  };
}

export async function computeApPeriodCloseChecklist(
  input: ApPeriodCloseChecklistInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    apHoldRepo: IApHoldRepo;
    apPaymentRunRepo: IApPaymentRunRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<ApPeriodCloseChecklist>> {
  const exceptions: ApCloseException[] = [];

  // 1. Open holds — all must be released before close
  const holdsResult = await deps.apHoldRepo.findAll({ page: 1, limit: 100, status: 'ACTIVE' });
  for (const hold of holdsResult.data) {
    exceptions.push({
      category: 'OPEN_HOLD',
      entityId: hold.id,
      description: `Active ${hold.holdType} hold on invoice ${hold.invoiceId}: ${hold.holdReason}`,
      blocking: true,
    });
  }

  // 2. Unpaid posted invoices (POSTED or PARTIALLY_PAID — should be reconciled)
  const postedResult = await deps.apInvoiceRepo.findByStatus('POSTED', { page: 1, limit: 100 });
  for (const inv of postedResult.data) {
    const outstanding = inv.totalAmount.amount - inv.paidAmount.amount;
    if (outstanding > 0n) {
      exceptions.push({
        category: 'UNPAID_POSTED',
        entityId: inv.id,
        description: `Posted invoice ${inv.invoiceNumber} has outstanding balance`,
        blocking: false,
      });
    }
  }

  const partialResult = await deps.apInvoiceRepo.findByStatus('PARTIALLY_PAID', {
    page: 1,
    limit: 100,
  });
  for (const inv of partialResult.data) {
    exceptions.push({
      category: 'UNPAID_POSTED',
      entityId: inv.id,
      description: `Partially paid invoice ${inv.invoiceNumber} has outstanding balance`,
      blocking: false,
    });
  }

  // 3. Unmatched invoices — APPROVED but not yet posted
  const approvedResult = await deps.apInvoiceRepo.findByStatus('APPROVED', { page: 1, limit: 100 });
  for (const inv of approvedResult.data) {
    exceptions.push({
      category: 'UNMATCHED_INVOICE',
      entityId: inv.id,
      description: `Approved invoice ${inv.invoiceNumber} has not been posted to GL`,
      blocking: true,
    });
  }

  // 4. Draft payment runs — should be completed or cancelled
  const draftRunsResult = await deps.apPaymentRunRepo.findAll({ page: 1, limit: 100 });
  for (const run of draftRunsResult.data) {
    if (run.status === 'DRAFT' || run.status === 'APPROVED') {
      exceptions.push({
        category: 'DRAFT_PAYMENT_RUN',
        entityId: run.id,
        description: `Payment run ${run.runNumber} is in ${run.status} status`,
        blocking: true,
      });
    }
  }

  const openHoldCount = exceptions.filter((e) => e.category === 'OPEN_HOLD').length;
  const unmatchedInvoiceCount = exceptions.filter((e) => e.category === 'UNMATCHED_INVOICE').length;
  const unpaidPostedCount = exceptions.filter((e) => e.category === 'UNPAID_POSTED').length;
  const draftPaymentRunCount = exceptions.filter((e) => e.category === 'DRAFT_PAYMENT_RUN').length;
  const totalBlockingCount = exceptions.filter((e) => e.blocking).length;

  return ok({
    canClose: totalBlockingCount === 0,
    exceptions,
    summary: {
      openHoldCount,
      unmatchedInvoiceCount,
      unpaidPostedCount,
      draftPaymentRunCount,
      totalBlockingCount,
    },
  });
}
