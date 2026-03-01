import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

/**
 * Returns total discount captured from executed payment runs in the last N days.
 * Used for AP dashboard KPI "Discount Savings".
 */

export interface ApDiscountSummaryInput {
  readonly tenantId: string;
  readonly days?: number;
}

export interface ApDiscountSummaryResult {
  readonly totalDiscount: string;
  readonly currencyCode: string;
  readonly days: number;
}

export async function getApDiscountSummary(
  input: ApDiscountSummaryInput,
  deps: { apPaymentRunRepo: IApPaymentRunRepo },
  _ctx?: FinanceContext
): Promise<Result<ApDiscountSummaryResult>> {
  const days = input.days ?? 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await deps.apPaymentRunRepo.getDiscountSumExecutedSince(cutoff);
  if (!result.ok) return result;

  return ok({
    totalDiscount: String(result.value.totalDiscount),
    currencyCode: result.value.currencyCode,
    days,
  });
}
