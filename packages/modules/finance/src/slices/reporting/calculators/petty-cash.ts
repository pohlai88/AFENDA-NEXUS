/**
 * GAP-D4: Petty Cash Management calculator.
 * Pure calculator — manages petty cash fund tracking, replenishment,
 * cash count reconciliation, and float management.
 *
 * All monetary values are bigint (minor units).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface PettyCashVoucher {
  readonly voucherId: string;
  readonly date: string;
  readonly description: string;
  readonly amount: bigint;
  readonly category: string;
  readonly approvedBy: string;
  readonly receiptAttached: boolean;
}

export interface PettyCashCount {
  readonly denomination: string;
  readonly quantity: number;
  readonly valuePerUnit: bigint;
}

export interface PettyCashInput {
  readonly fundName: string;
  readonly authorizedFloat: bigint;
  readonly openingBalance: bigint;
  readonly vouchers: readonly PettyCashVoucher[];
  readonly cashCount?: readonly PettyCashCount[];
  readonly iousOutstanding?: bigint;
  readonly advancesOutstanding?: bigint;
  readonly currencyCode: string;
}

export interface PettyCashResult {
  readonly fundName: string;
  readonly authorizedFloat: bigint;
  readonly openingBalance: bigint;
  readonly totalDisbursements: bigint;
  readonly calculatedBalance: bigint;
  readonly physicalCount: bigint | null;
  readonly shortage: bigint;
  readonly overage: bigint;
  readonly iousOutstanding: bigint;
  readonly advancesOutstanding: bigint;
  readonly replenishmentRequired: bigint;
  readonly voucherCount: number;
  readonly vouchersWithoutReceipts: number;
  readonly categoryBreakdown: readonly CategoryBreakdown[];
  readonly isReconciled: boolean;
  readonly currencyCode: string;
}

export interface CategoryBreakdown {
  readonly category: string;
  readonly totalAmount: bigint;
  readonly voucherCount: number;
}

/**
 * Computes petty cash reconciliation and replenishment requirements.
 */
export function reconcilePettyCash(input: PettyCashInput): CalculatorResult<PettyCashResult> {
  const totalDisbursements = input.vouchers.reduce((s, v) => s + v.amount, 0n);
  const calculatedBalance = input.openingBalance - totalDisbursements;

  // Physical cash count
  let physicalCount: bigint | null = null;
  if (input.cashCount && input.cashCount.length > 0) {
    physicalCount = input.cashCount.reduce((s, c) => s + c.valuePerUnit * BigInt(c.quantity), 0n);
  }

  const ious = input.iousOutstanding ?? 0n;
  const advances = input.advancesOutstanding ?? 0n;

  // Shortage/overage
  let shortage = 0n;
  let overage = 0n;
  if (physicalCount !== null) {
    const accountedBalance = calculatedBalance - ious - advances;
    const diff = physicalCount - accountedBalance;
    if (diff < 0n) shortage = -diff;
    else if (diff > 0n) overage = diff;
  }

  // Replenishment to restore to authorized float
  const replenishmentRequired =
    input.authorizedFloat - calculatedBalance > 0n ? input.authorizedFloat - calculatedBalance : 0n;

  // Vouchers without receipts
  const vouchersWithoutReceipts = input.vouchers.filter((v) => !v.receiptAttached).length;

  // Category breakdown
  const catMap = new Map<string, { total: bigint; count: number }>();
  for (const v of input.vouchers) {
    const existing = catMap.get(v.category) ?? { total: 0n, count: 0 };
    catMap.set(v.category, {
      total: existing.total + v.amount,
      count: existing.count + 1,
    });
  }
  const categoryBreakdown: CategoryBreakdown[] = [...catMap.entries()].map(([category, data]) => ({
    category,
    totalAmount: data.total,
    voucherCount: data.count,
  }));

  const isReconciled = physicalCount !== null && shortage === 0n && overage === 0n;

  return {
    result: {
      fundName: input.fundName,
      authorizedFloat: input.authorizedFloat,
      openingBalance: input.openingBalance,
      totalDisbursements,
      calculatedBalance,
      physicalCount,
      shortage,
      overage,
      iousOutstanding: ious,
      advancesOutstanding: advances,
      replenishmentRequired,
      voucherCount: input.vouchers.length,
      vouchersWithoutReceipts,
      categoryBreakdown,
      isReconciled,
      currencyCode: input.currencyCode,
    },
    inputs: {
      fundName: input.fundName,
      authorizedFloat: input.authorizedFloat.toString(),
      voucherCount: input.vouchers.length,
    },
    explanation:
      `Petty cash '${input.fundName}': opening=${input.openingBalance}, ` +
      `disbursements=${totalDisbursements}, balance=${calculatedBalance}, ` +
      `replenishment=${replenishmentRequired}` +
      (shortage > 0n ? `, SHORTAGE=${shortage}` : '') +
      (overage > 0n ? `, OVERAGE=${overage}` : ''),
  };
}
