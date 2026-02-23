import { describe, it, expect } from "vitest";
import {
  computeRevaluation,
  derivePostings,
  allocateByDriver,
} from "../domain/calculators/index.js";
import type { MonetaryBalance } from "../domain/calculators/fx-revaluation.js";
import type { DerivationRule, SourceTransaction } from "../domain/calculators/derivation-engine.js";
import type { AllocationDriver } from "../domain/calculators/derivation-engine.js";

// ── FX Revaluation ──────────────────────────────────────────────────

describe("computeRevaluation", () => {
  it("computes unrealized gain when rate increases", () => {
    const balances: MonetaryBalance[] = [
      {
        accountId: "a1", accountCode: "1100", accountType: "ASSET",
        originalCurrency: "EUR", originalMinor: 10000n,
        bookValueMinor: 15000n, bookCurrency: "USD",
      },
    ];
    // Original: 10000 EUR at old rate → 15000 USD book value
    // New closing rate 1.6 → 10000 * 1.6 = 16000 USD
    // Unrealized gain = 16000 - 15000 = 1000
    const result = computeRevaluation(balances, 1.6, "2025-12-31");
    expect(result.result.lines).toHaveLength(1);
    expect(result.result.lines[0].revaluedAmount).toBe(16000n);
    expect(result.result.lines[0].unrealizedGainLoss).toBe(1000n);
    expect(result.result.lines[0].isGain).toBe(true);
    expect(result.result.totalUnrealizedGain).toBe(1000n);
    expect(result.result.totalUnrealizedLoss).toBe(0n);
  });

  it("computes unrealized loss when rate decreases", () => {
    const balances: MonetaryBalance[] = [
      {
        accountId: "a1", accountCode: "1100", accountType: "ASSET",
        originalCurrency: "EUR", originalMinor: 10000n,
        bookValueMinor: 15000n, bookCurrency: "USD",
      },
    ];
    // New closing rate 1.3 → 10000 * 1.3 = 13000 USD
    // Unrealized loss = 13000 - 15000 = -2000
    const result = computeRevaluation(balances, 1.3, "2025-12-31");
    expect(result.result.lines[0].unrealizedGainLoss).toBe(-2000n);
    expect(result.result.lines[0].isGain).toBe(false);
    expect(result.result.totalUnrealizedLoss).toBe(2000n);
  });

  it("skips revenue/expense/equity accounts", () => {
    const balances: MonetaryBalance[] = [
      {
        accountId: "r1", accountCode: "4000", accountType: "REVENUE",
        originalCurrency: "EUR", originalMinor: 5000n,
        bookValueMinor: 7500n, bookCurrency: "USD",
      },
      {
        accountId: "a1", accountCode: "1100", accountType: "ASSET",
        originalCurrency: "EUR", originalMinor: 10000n,
        bookValueMinor: 15000n, bookCurrency: "USD",
      },
    ];
    const result = computeRevaluation(balances, 1.6, "2025-12-31");
    // Only the ASSET should be revalued
    expect(result.result.lines).toHaveLength(1);
    expect(result.result.lines[0].accountCode).toBe("1100");
  });

  it("skips same-currency balances", () => {
    const balances: MonetaryBalance[] = [
      {
        accountId: "a1", accountCode: "1100", accountType: "ASSET",
        originalCurrency: "USD", originalMinor: 10000n,
        bookValueMinor: 10000n, bookCurrency: "USD",
      },
    ];
    const result = computeRevaluation(balances, 1.5, "2025-12-31");
    expect(result.result.lines).toHaveLength(0);
  });

  it("revalues liabilities", () => {
    const balances: MonetaryBalance[] = [
      {
        accountId: "l1", accountCode: "2100", accountType: "LIABILITY",
        originalCurrency: "EUR", originalMinor: 8000n,
        bookValueMinor: 12000n, bookCurrency: "USD",
      },
    ];
    const result = computeRevaluation(balances, 1.6, "2025-12-31");
    // 8000 * 1.6 = 12800, diff = 800 gain
    expect(result.result.lines[0].revaluedAmount).toBe(12800n);
    expect(result.result.lines[0].unrealizedGainLoss).toBe(800n);
  });

  it("throws on invalid rate", () => {
    expect(() => computeRevaluation([], 0, "2025-12-31")).toThrow("finite and > 0");
    expect(() => computeRevaluation([], -1, "2025-12-31")).toThrow("finite and > 0");
  });
});

// ── Derivation Engine ───────────────────────────────────────────────

describe("derivePostings", () => {
  const rules: DerivationRule[] = [
    {
      id: "r1", name: "COGS from Sales", type: "posting",
      sourceAccountId: "sales", targetAccountId: "cogs",
      percentage: 60, isActive: true, priority: 1,
    },
    {
      id: "r2", name: "Tax Provision", type: "accrual",
      sourceAccountId: "sales", targetAccountId: "tax-payable",
      percentage: 10, isActive: true, priority: 2,
    },
    {
      id: "r3", name: "Inactive Rule", type: "posting",
      sourceAccountId: "sales", targetAccountId: "other",
      percentage: 5, isActive: false, priority: 3,
    },
  ];

  it("derives lines from matching rules", () => {
    const txs: SourceTransaction[] = [
      { transactionId: "tx1", accountId: "sales", amountMinor: 10000n, currency: "USD", description: "Invoice 001" },
    ];
    const result = derivePostings(txs, rules);
    // 2 active rules match: 60% and 10%
    expect(result.result.derivedLines).toHaveLength(2);
    expect(result.result.derivedLines[0].amountMinor).toBe(6000n);
    expect(result.result.derivedLines[1].amountMinor).toBe(1000n);
    expect(result.result.totalDerived).toBe(7000n);
    expect(result.result.unmatchedTransactions).toHaveLength(0);
  });

  it("reports unmatched transactions", () => {
    const txs: SourceTransaction[] = [
      { transactionId: "tx1", accountId: "unknown", amountMinor: 5000n, currency: "USD", description: "Mystery" },
    ];
    const result = derivePostings(txs, rules);
    expect(result.result.derivedLines).toHaveLength(0);
    expect(result.result.unmatchedTransactions).toEqual(["tx1"]);
  });

  it("skips inactive rules", () => {
    const txs: SourceTransaction[] = [
      { transactionId: "tx1", accountId: "sales", amountMinor: 10000n, currency: "USD", description: "Test" },
    ];
    const result = derivePostings(txs, rules);
    // Only 2 active rules, not the inactive one
    expect(result.result.derivedLines).toHaveLength(2);
    expect(result.result.derivedLines.every((l) => l.ruleId !== "r3")).toBe(true);
  });

  it("applies rules in priority order", () => {
    const txs: SourceTransaction[] = [
      { transactionId: "tx1", accountId: "sales", amountMinor: 10000n, currency: "USD", description: "Test" },
    ];
    const result = derivePostings(txs, rules);
    expect(result.result.derivedLines[0].ruleId).toBe("r1");
    expect(result.result.derivedLines[1].ruleId).toBe("r2");
  });

  it("throws on invalid percentage", () => {
    const badRules: DerivationRule[] = [
      { id: "r1", name: "Bad", type: "posting", sourceAccountId: "a", targetAccountId: "b", percentage: 0, isActive: true, priority: 1 },
    ];
    const txs: SourceTransaction[] = [
      { transactionId: "tx1", accountId: "a", amountMinor: 100n, currency: "USD", description: "Test" },
    ];
    expect(() => derivePostings(txs, badRules)).toThrow("invalid percentage");
  });
});

// ── Allocation Engine ───────────────────────────────────────────────

describe("allocateByDriver", () => {
  it("allocates proportionally by weight", () => {
    const drivers: AllocationDriver[] = [
      { targetAccountId: "dept-a", weight: 60 },
      { targetAccountId: "dept-b", weight: 40 },
    ];
    const result = allocateByDriver(10000n, drivers, "USD");
    expect(result.result.allocations).toHaveLength(2);
    expect(result.result.allocations[0].amountMinor).toBe(6000n);
    expect(result.result.allocations[1].amountMinor).toBe(4000n);
    expect(result.result.remainder).toBe(0n);
  });

  it("handles uneven splits with largest-remainder method", () => {
    const drivers: AllocationDriver[] = [
      { targetAccountId: "a", weight: 1 },
      { targetAccountId: "b", weight: 1 },
      { targetAccountId: "c", weight: 1 },
    ];
    // 100 / 3 = 33.33... each, remainder 1 goes to first
    const result = allocateByDriver(100n, drivers, "USD");
    const total = result.result.allocations.reduce((s, a) => s + a.amountMinor, 0n);
    expect(total).toBe(100n);
    expect(result.result.remainder).toBe(0n);
  });

  it("handles single driver", () => {
    const drivers: AllocationDriver[] = [
      { targetAccountId: "sole", weight: 100 },
    ];
    const result = allocateByDriver(5000n, drivers, "USD");
    expect(result.result.allocations[0].amountMinor).toBe(5000n);
  });

  it("throws on zero total", () => {
    const drivers: AllocationDriver[] = [{ targetAccountId: "a", weight: 1 }];
    expect(() => allocateByDriver(0n, drivers, "USD")).toThrow("positive");
  });

  it("throws on empty drivers", () => {
    expect(() => allocateByDriver(100n, [], "USD")).toThrow("At least one");
  });

  it("preserves exact total for complex weights", () => {
    const drivers: AllocationDriver[] = [
      { targetAccountId: "a", weight: 33 },
      { targetAccountId: "b", weight: 33 },
      { targetAccountId: "c", weight: 34 },
    ];
    const result = allocateByDriver(99999n, drivers, "USD");
    const total = result.result.allocations.reduce((s, a) => s + a.amountMinor, 0n);
    expect(total).toBe(99999n);
  });
});
