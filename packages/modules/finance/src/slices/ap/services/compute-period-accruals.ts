import { ok } from '@afenda/core';
import type { Result } from '@afenda/core';
import { computeAccruedLiabilities } from '../calculators/accrued-liabilities.js';
import type { UninvoicedReceipt, AccrualEntry } from '../calculators/accrued-liabilities.js';

export interface ComputePeriodAccrualsInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly fiscalPeriodId: string;
  readonly accruedLiabilityAccountId: string;
  readonly uninvoicedReceipts: readonly UninvoicedReceipt[];
}

export interface PeriodAccrualResult {
  readonly fiscalPeriodId: string;
  readonly entries: readonly AccrualEntry[];
  readonly totalAccrualAmount: bigint;
  readonly receiptCount: number;
}

/**
 * W2-6: Compute accrued liabilities as a period-close service step.
 *
 * Takes uninvoiced receipts for the period and produces journal entries
 * that should be posted as part of the period close process.
 * The caller is responsible for creating the actual GL journal from these entries.
 */
export function computePeriodAccruals(
  input: ComputePeriodAccrualsInput
): Result<PeriodAccrualResult> {
  const entries = computeAccruedLiabilities(
    input.uninvoicedReceipts,
    input.accruedLiabilityAccountId
  );

  const totalAccrualAmount = entries.reduce((sum, e) => sum + e.amount, 0n);

  return ok({
    fiscalPeriodId: input.fiscalPeriodId,
    entries,
    totalAccrualAmount,
    receiptCount: input.uninvoicedReceipts.length,
  });
}
