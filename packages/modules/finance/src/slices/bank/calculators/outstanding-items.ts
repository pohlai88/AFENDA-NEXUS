/**
 * BR-06: Outstanding checks / deposits-in-transit calculator.
 * Pure calculator — no DB, no side effects.
 * Computes reconciliation adjustments for items not yet cleared by the bank.
 */

export interface OutstandingItem {
  readonly id: string;
  readonly documentRef: string;
  readonly documentDate: Date;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly type: "CHECK" | "DEPOSIT";
}

export interface OutstandingItemsResult {
  readonly outstandingChecks: readonly OutstandingItem[];
  readonly depositsInTransit: readonly OutstandingItem[];
  readonly totalOutstandingChecks: bigint;
  readonly totalDepositsInTransit: bigint;
  readonly adjustedBankBalance: bigint;
}

/**
 * Compute outstanding items and adjusted bank balance.
 * Adjusted bank balance = statement balance - outstanding checks + deposits in transit
 */
export function computeOutstandingItems(
  statementBalance: bigint,
  items: readonly OutstandingItem[],
): OutstandingItemsResult {
  const checks = items.filter((i) => i.type === "CHECK");
  const deposits = items.filter((i) => i.type === "DEPOSIT");

  let totalChecks = 0n;
  for (const c of checks) totalChecks += c.amount;

  let totalDeposits = 0n;
  for (const d of deposits) totalDeposits += d.amount;

  return {
    outstandingChecks: checks,
    depositsInTransit: deposits,
    totalOutstandingChecks: totalChecks,
    totalDepositsInTransit: totalDeposits,
    adjustedBankBalance: statementBalance - totalChecks + totalDeposits,
  };
}
