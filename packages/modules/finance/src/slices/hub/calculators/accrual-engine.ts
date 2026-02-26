/**
 * @see AH-02 — Accrual engine: time-based revenue/expense recognition
 * @see IFRS-15 — Revenue recognition over time
 * @see IAS-37  — Provisions and accrued liabilities
 *
 * Pure calculator — no I/O, no side effects.
 * Computes accrual and deferral journal entries for:
 * - Prepaid expenses (spread over service period)
 * - Accrued revenue (recognize earned but unbilled)
 * - Accrued expenses (recognize incurred but unpaid)
 * - Deferred revenue (release over delivery period)
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type AccrualType =
  | 'prepaid_expense'
  | 'accrued_revenue'
  | 'accrued_expense'
  | 'deferred_revenue';

export type AccrualMethod = 'straight_line' | 'usage_based' | 'milestone';

export interface AccrualSchedule {
  readonly id: string;
  readonly type: AccrualType;
  readonly method: AccrualMethod;
  readonly sourceAccountId: string;
  readonly targetAccountId: string;
  readonly totalAmountMinor: bigint;
  readonly recognizedToDateMinor: bigint;
  readonly startDate: string;
  readonly endDate: string;
  readonly currency: string;
  readonly description: string;
  readonly milestonePercent?: number;
}

export interface AccrualEntry {
  readonly scheduleId: string;
  readonly type: AccrualType;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly memo: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export interface AccrualResult {
  readonly entries: readonly AccrualEntry[];
  readonly totalAccrued: bigint;
  readonly schedulesProcessed: number;
  readonly schedulesSkipped: number;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / (24 * 60 * 60 * 1000)));
}

/**
 * Computes accrual entries for a given period.
 *
 * For straight-line: daily rate × days in period
 * For milestone: full milestone amount when milestone is reached
 * For usage-based: caller provides milestonePercent as usage %
 *
 * Sign conventions by type:
 * - prepaid_expense: DR Expense, CR Prepaid Asset
 * - accrued_revenue: DR Receivable, CR Revenue
 * - accrued_expense: DR Expense, CR Accrued Liability
 * - deferred_revenue: DR Deferred Revenue, CR Revenue
 */
export function computeAccruals(
  schedules: readonly AccrualSchedule[],
  periodStart: string,
  periodEnd: string
): CalculatorResult<AccrualResult> {
  const entries: AccrualEntry[] = [];
  let totalAccrued = 0n;
  let skipped = 0;

  for (const sched of schedules) {
    if (sched.totalAmountMinor <= 0n) {
      throw new Error(`Schedule ${sched.id} has non-positive total: ${sched.totalAmountMinor}`);
    }

    const remaining = sched.totalAmountMinor - sched.recognizedToDateMinor;
    if (remaining <= 0n) {
      skipped++;
      continue;
    }

    // Check if period overlaps with schedule
    if (periodEnd < sched.startDate || periodStart > sched.endDate) {
      skipped++;
      continue;
    }

    let amount: bigint;

    switch (sched.method) {
      case 'straight_line': {
        const totalDays = daysBetween(sched.startDate, sched.endDate);
        // Clamp period to schedule bounds
        const effectiveStart = periodStart > sched.startDate ? periodStart : sched.startDate;
        const effectiveEnd = periodEnd < sched.endDate ? periodEnd : sched.endDate;
        const periodDays = daysBetween(effectiveStart, effectiveEnd);

        // Pro-rata: (total × periodDays) / totalDays
        const raw = (sched.totalAmountMinor * BigInt(periodDays)) / BigInt(totalDays);
        amount = raw > remaining ? remaining : raw;
        break;
      }
      case 'milestone': {
        const pct = sched.milestonePercent ?? 0;
        if (pct <= 0 || pct > 100) {
          skipped++;
          continue;
        }
        // eslint-disable-next-line no-restricted-syntax -- percentage-to-BigInt, not FX
        const milestoneAmount = (sched.totalAmountMinor * BigInt(Math.round(pct * 100))) / 10000n;
        amount = milestoneAmount > remaining ? remaining : milestoneAmount;
        break;
      }
      case 'usage_based': {
        const usagePct = sched.milestonePercent ?? 0;
        if (usagePct <= 0) {
          skipped++;
          continue;
        }
        // eslint-disable-next-line no-restricted-syntax -- percentage-to-BigInt, not FX
        const usageAmount = (sched.totalAmountMinor * BigInt(Math.round(usagePct * 100))) / 10000n;
        const alreadyRecognized = sched.recognizedToDateMinor;
        const shouldRecognize =
          usageAmount > sched.totalAmountMinor ? sched.totalAmountMinor : usageAmount;
        amount = shouldRecognize - alreadyRecognized;
        if (amount <= 0n) {
          skipped++;
          continue;
        }
        break;
      }
      default:
        throw new Error(`Unknown accrual method: ${sched.method}`);
    }

    if (amount <= 0n) {
      skipped++;
      continue;
    }

    // Determine debit/credit based on accrual type
    let debitAccountId: string;
    let creditAccountId: string;

    switch (sched.type) {
      case 'prepaid_expense':
        debitAccountId = sched.targetAccountId; // Expense
        creditAccountId = sched.sourceAccountId; // Prepaid Asset
        break;
      case 'accrued_revenue':
        debitAccountId = sched.sourceAccountId; // Receivable
        creditAccountId = sched.targetAccountId; // Revenue
        break;
      case 'accrued_expense':
        debitAccountId = sched.targetAccountId; // Expense
        creditAccountId = sched.sourceAccountId; // Accrued Liability
        break;
      case 'deferred_revenue':
        debitAccountId = sched.sourceAccountId; // Deferred Revenue
        creditAccountId = sched.targetAccountId; // Revenue
        break;
    }

    totalAccrued += amount;
    entries.push({
      scheduleId: sched.id,
      type: sched.type,
      debitAccountId,
      creditAccountId,
      amountMinor: amount,
      currency: sched.currency,
      memo: `${sched.type} — ${sched.description}`,
      periodStart,
      periodEnd,
    });
  }

  return {
    result: {
      entries,
      totalAccrued,
      schedulesProcessed: schedules.length - skipped,
      schedulesSkipped: skipped,
    },
    inputs: { scheduleCount: schedules.length, periodStart, periodEnd },
    explanation: `Accruals: ${entries.length} entries, total=${totalAccrued}, processed=${schedules.length - skipped}, skipped=${skipped}`,
  };
}
