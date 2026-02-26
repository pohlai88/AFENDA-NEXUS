/**
 * SB-01: Subscription proration calculator.
 * Computes prorated charges for mid-cycle subscription changes
 * (upgrades, downgrades, cancellations).
 * Pure calculator — no DB, no side effects.
 */

import type { CalculatorResult } from '../../../shared/types.js';

export type ProrationMethod = 'DAILY' | 'CALENDAR_MONTH' | 'NONE';
export type ChangeType = 'UPGRADE' | 'DOWNGRADE' | 'CANCELLATION' | 'NEW';

export interface SubscriptionChange {
  readonly subscriptionId: string;
  readonly changeType: ChangeType;
  readonly oldPlanAmount: bigint;
  readonly newPlanAmount: bigint;
  readonly billingCycleStartDate: string;
  readonly billingCycleEndDate: string;
  readonly changeDate: string;
  readonly currencyCode: string;
}

export interface ProrationLine {
  readonly subscriptionId: string;
  readonly changeType: ChangeType;
  readonly creditAmount: bigint;
  readonly chargeAmount: bigint;
  readonly netAmount: bigint;
  readonly daysUsedOldPlan: number;
  readonly daysRemainingNewPlan: number;
  readonly totalCycleDays: number;
  readonly currencyCode: string;
}

export interface ProrationResult {
  readonly lines: readonly ProrationLine[];
  readonly totalCredits: bigint;
  readonly totalCharges: bigint;
  readonly netAmount: bigint;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / (24 * 60 * 60 * 1000)));
}

/**
 * Compute prorated subscription charges.
 */
export function computeSubscriptionProration(
  changes: readonly SubscriptionChange[],
  method: ProrationMethod = 'DAILY'
): CalculatorResult<ProrationResult> {
  if (changes.length === 0) throw new Error('At least one subscription change is required');

  const lines: ProrationLine[] = [];
  let totalCredits = 0n;
  let totalCharges = 0n;

  for (const change of changes) {
    const totalCycleDays = daysBetween(change.billingCycleStartDate, change.billingCycleEndDate);
    const daysUsedOldPlan = daysBetween(change.billingCycleStartDate, change.changeDate);
    const daysRemainingNewPlan = totalCycleDays - daysUsedOldPlan;

    let creditAmount: bigint;
    let chargeAmount: bigint;

    if (method === 'NONE') {
      creditAmount = 0n;
      chargeAmount = change.newPlanAmount;
    } else {
      // Daily proration
      const dailyOld = change.oldPlanAmount / BigInt(totalCycleDays);
      const dailyNew = change.newPlanAmount / BigInt(totalCycleDays);

      // Credit for unused days on old plan
      creditAmount = dailyOld * BigInt(daysRemainingNewPlan);
      // Charge for remaining days on new plan
      chargeAmount =
        change.changeType === 'CANCELLATION' ? 0n : dailyNew * BigInt(daysRemainingNewPlan);
    }

    const netAmount = chargeAmount - creditAmount;

    lines.push({
      subscriptionId: change.subscriptionId,
      changeType: change.changeType,
      creditAmount,
      chargeAmount,
      netAmount,
      daysUsedOldPlan,
      daysRemainingNewPlan,
      totalCycleDays,
      currencyCode: change.currencyCode,
    });

    totalCredits += creditAmount;
    totalCharges += chargeAmount;
  }

  return {
    result: {
      lines,
      totalCredits,
      totalCharges,
      netAmount: totalCharges - totalCredits,
    },
    inputs: { changeCount: changes.length, method },
    explanation: `Proration: ${lines.length} changes, credits=${totalCredits}, charges=${totalCharges}`,
  };
}
