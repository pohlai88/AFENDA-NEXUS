/**
 * @see AH-04 — Revenue recognition schedules
 * @see AIS A-25 — Deferred revenue roll-forward report
 *
 * Pure calculator — no I/O, no side effects.
 * Computes a deferred revenue roll-forward for a period, showing opening balance,
 * new deferrals, recognitions, adjustments, and closing balance per contract/account.
 */
import type { Money } from "@afenda/core";
import { money } from "@afenda/core";
import type { CalculatorResult } from "./journal-balance.js";

export interface DeferredRevenueEntry {
  readonly contractId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly openingBalance: bigint;
  readonly newDeferrals: bigint;
  readonly recognized: bigint;
  readonly adjustments: bigint;
}

export interface DeferredRevenueLineResult {
  readonly contractId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly openingBalance: Money;
  readonly newDeferrals: Money;
  readonly recognized: Money;
  readonly adjustments: Money;
  readonly closingBalance: Money;
}

export interface DeferredRevenueRollForward {
  readonly periodId: string;
  readonly currency: string;
  readonly lines: readonly DeferredRevenueLineResult[];
  readonly totalOpening: Money;
  readonly totalNewDeferrals: Money;
  readonly totalRecognized: Money;
  readonly totalAdjustments: Money;
  readonly totalClosing: Money;
}

export function computeDeferredRevenueRollForward(
  entries: readonly DeferredRevenueEntry[],
  periodId: string,
  currency: string,
): CalculatorResult<DeferredRevenueRollForward> {
  const lines: DeferredRevenueLineResult[] = entries.map((e) => {
    const closing = e.openingBalance + e.newDeferrals - e.recognized + e.adjustments;
    return {
      contractId: e.contractId,
      accountCode: e.accountCode,
      accountName: e.accountName,
      openingBalance: money(e.openingBalance, currency),
      newDeferrals: money(e.newDeferrals, currency),
      recognized: money(e.recognized, currency),
      adjustments: money(e.adjustments, currency),
      closingBalance: money(closing, currency),
    };
  });

  const totalOpening = lines.reduce((s, l) => s + l.openingBalance.amount, 0n);
  const totalNewDeferrals = lines.reduce((s, l) => s + l.newDeferrals.amount, 0n);
  const totalRecognized = lines.reduce((s, l) => s + l.recognized.amount, 0n);
  const totalAdjustments = lines.reduce((s, l) => s + l.adjustments.amount, 0n);
  const totalClosing = lines.reduce((s, l) => s + l.closingBalance.amount, 0n);

  return {
    result: {
      periodId,
      currency,
      lines,
      totalOpening: money(totalOpening, currency),
      totalNewDeferrals: money(totalNewDeferrals, currency),
      totalRecognized: money(totalRecognized, currency),
      totalAdjustments: money(totalAdjustments, currency),
      totalClosing: money(totalClosing, currency),
    },
    inputs: { entryCount: entries.length, periodId, currency },
    explanation: `Deferred revenue roll-forward: ${entries.length} contracts, opening=${totalOpening} closing=${totalClosing}`,
  };
}
