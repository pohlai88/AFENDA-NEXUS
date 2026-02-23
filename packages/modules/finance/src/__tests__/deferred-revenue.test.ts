import { describe, it, expect } from "vitest";
import { computeDeferredRevenueRollForward } from "../domain/index.js";
import type { DeferredRevenueEntry } from "../domain/index.js";

describe("computeDeferredRevenueRollForward (A-25)", () => {
  it("returns empty roll-forward for no entries", () => {
    const { result } = computeDeferredRevenueRollForward([], "period-1", "USD");
    expect(result.lines).toHaveLength(0);
    expect(result.totalOpening.amount).toBe(0n);
    expect(result.totalClosing.amount).toBe(0n);
  });

  it("computes closing = opening + new - recognized + adjustments", () => {
    const entries: DeferredRevenueEntry[] = [
      {
        contractId: "c-1",
        accountCode: "2500",
        accountName: "Deferred Revenue",
        openingBalance: 100000n,
        newDeferrals: 50000n,
        recognized: 30000n,
        adjustments: 0n,
      },
    ];
    const { result } = computeDeferredRevenueRollForward(entries, "period-1", "USD");
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]!.closingBalance.amount).toBe(120000n);
    expect(result.totalOpening.amount).toBe(100000n);
    expect(result.totalNewDeferrals.amount).toBe(50000n);
    expect(result.totalRecognized.amount).toBe(30000n);
    expect(result.totalClosing.amount).toBe(120000n);
  });

  it("handles adjustments (positive and negative)", () => {
    const entries: DeferredRevenueEntry[] = [
      {
        contractId: "c-1",
        accountCode: "2500",
        accountName: "Deferred Revenue A",
        openingBalance: 50000n,
        newDeferrals: 0n,
        recognized: 10000n,
        adjustments: 5000n,
      },
      {
        contractId: "c-2",
        accountCode: "2500",
        accountName: "Deferred Revenue B",
        openingBalance: 80000n,
        newDeferrals: 20000n,
        recognized: 40000n,
        adjustments: -3000n,
      },
    ];
    const { result } = computeDeferredRevenueRollForward(entries, "period-2", "USD");
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]!.closingBalance.amount).toBe(45000n);
    expect(result.lines[1]!.closingBalance.amount).toBe(57000n);
    expect(result.totalClosing.amount).toBe(102000n);
  });

  it("aggregates totals across multiple contracts", () => {
    const entries: DeferredRevenueEntry[] = [
      { contractId: "c-1", accountCode: "2500", accountName: "A", openingBalance: 10000n, newDeferrals: 5000n, recognized: 3000n, adjustments: 0n },
      { contractId: "c-2", accountCode: "2501", accountName: "B", openingBalance: 20000n, newDeferrals: 10000n, recognized: 8000n, adjustments: 1000n },
      { contractId: "c-3", accountCode: "2502", accountName: "C", openingBalance: 30000n, newDeferrals: 0n, recognized: 15000n, adjustments: 0n },
    ];
    const { result } = computeDeferredRevenueRollForward(entries, "period-3", "USD");
    expect(result.totalOpening.amount).toBe(60000n);
    expect(result.totalNewDeferrals.amount).toBe(15000n);
    expect(result.totalRecognized.amount).toBe(26000n);
    expect(result.totalAdjustments.amount).toBe(1000n);
    expect(result.totalClosing.amount).toBe(50000n);
  });

  it("preserves period and currency metadata", () => {
    const { result } = computeDeferredRevenueRollForward([], "FY2025-Q1", "EUR");
    expect(result.periodId).toBe("FY2025-Q1");
    expect(result.currency).toBe("EUR");
  });
});
