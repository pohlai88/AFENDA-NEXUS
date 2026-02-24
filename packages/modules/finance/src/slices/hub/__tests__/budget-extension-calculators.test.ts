import { describe, it, expect } from "vitest";
import { computeRollingForecast } from "../calculators/rolling-forecast.js";
import { computeEncumbrance } from "../calculators/encumbrance.js";
import { computeScenarioPlanning } from "../calculators/scenario-planning.js";
import { computeBudgetConsolidation } from "../calculators/budget-consolidation.js";

// ── Rolling Forecast ──────────────────────────────────────────────────

describe("computeRollingForecast", () => {
  it("computes average-based forecast", () => {
    const result = computeRollingForecast({
      historicalPeriods: [
        { periodId: "p1", accountCode: "6000", actualAmount: 10000n },
        { periodId: "p2", accountCode: "6000", actualAmount: 12000n },
        { periodId: "p3", accountCode: "6000", actualAmount: 11000n },
      ],
      method: "AVERAGE",
      periodsToForecast: 2,
      currencyCode: "USD",
    });
    expect(result.result.periodsForecasted).toBe(2);
    expect(result.result.accountCount).toBe(1);
    expect(result.result.lines).toHaveLength(2);
    // Average of 10000, 12000, 11000 = 11000
    expect(result.result.lines[0]!.forecastAmount).toBe(11000n);
  });

  it("computes trend-based forecast", () => {
    const result = computeRollingForecast({
      historicalPeriods: [
        { periodId: "p1", accountCode: "6000", actualAmount: 10000n },
        { periodId: "p2", accountCode: "6000", actualAmount: 12000n },
        { periodId: "p3", accountCode: "6000", actualAmount: 14000n },
      ],
      method: "TREND",
      periodsToForecast: 1,
      currencyCode: "USD",
    });
    // Avg delta = 2000, last = 14000, forecast = 14000 + 2000*1 = 16000
    expect(result.result.lines[0]!.forecastAmount).toBe(16000n);
  });

  it("computes growth-rate forecast", () => {
    const result = computeRollingForecast({
      historicalPeriods: [
        { periodId: "p1", accountCode: "6000", actualAmount: 10000n },
      ],
      method: "GROWTH_RATE",
      periodsToForecast: 1,
      growthRateBps: 500, // 5%
      currencyCode: "USD",
    });
    // 10000 + (10000 * 500 * 1) / 10000 = 10500
    expect(result.result.lines[0]!.forecastAmount).toBe(10500n);
  });

  it("applies manual overrides", () => {
    const result = computeRollingForecast({
      historicalPeriods: [
        { periodId: "p1", accountCode: "6000", actualAmount: 10000n },
      ],
      method: "AVERAGE",
      periodsToForecast: 1,
      overrides: [{ accountCode: "6000", amount: 99999n }],
      currencyCode: "USD",
    });
    expect(result.result.lines[0]!.forecastAmount).toBe(99999n);
    expect(result.result.lines[0]!.isOverride).toBe(true);
  });

  it("throws on zero periods to forecast", () => {
    expect(() =>
      computeRollingForecast({
        historicalPeriods: [{ periodId: "p1", accountCode: "a", actualAmount: 1n }],
        method: "AVERAGE",
        periodsToForecast: 0,
        currencyCode: "USD",
      }),
    ).toThrow("periodsToForecast must be positive");
  });

  it("throws on empty historical data", () => {
    expect(() =>
      computeRollingForecast({
        historicalPeriods: [],
        method: "AVERAGE",
        periodsToForecast: 1,
        currencyCode: "USD",
      }),
    ).toThrow("At least one historical period");
  });
});

// ── Encumbrance ───────────────────────────────────────────────────────

describe("computeEncumbrance", () => {
  it("computes available budget with encumbrances", () => {
    const result = computeEncumbrance({
      encumbrances: [
        { documentId: "po-1", documentType: "PURCHASE_ORDER", accountCode: "6100", encumberedAmount: 5000n, liquidatedAmount: 2000n },
      ],
      budgetLines: [
        { accountCode: "6100", budgetAmount: 20000n, actualSpent: 8000n },
      ],
      currencyCode: "USD",
    });
    expect(result.result.accounts).toHaveLength(1);
    const acct = result.result.accounts[0]!;
    // Open encumbrance = 5000 - 2000 = 3000
    expect(acct.openEncumbrance).toBe(3000n);
    // Available = 20000 - 8000 - 3000 = 9000
    expect(acct.availableBudget).toBe(9000n);
    expect(acct.isOverCommitted).toBe(false);
  });

  it("detects over-committed accounts", () => {
    const result = computeEncumbrance({
      encumbrances: [
        { documentId: "po-1", documentType: "PURCHASE_ORDER", accountCode: "6100", encumberedAmount: 15000n, liquidatedAmount: 0n },
      ],
      budgetLines: [
        { accountCode: "6100", budgetAmount: 20000n, actualSpent: 10000n },
      ],
      currencyCode: "USD",
    });
    const acct = result.result.accounts[0]!;
    // Available = 20000 - 10000 - 15000 = -5000
    expect(acct.isOverCommitted).toBe(true);
    expect(result.result.overCommittedCount).toBe(1);
  });

  it("handles accounts with no encumbrances", () => {
    const result = computeEncumbrance({
      encumbrances: [],
      budgetLines: [
        { accountCode: "6100", budgetAmount: 20000n, actualSpent: 5000n },
      ],
      currencyCode: "USD",
    });
    expect(result.result.accounts[0]!.openEncumbrance).toBe(0n);
    expect(result.result.accounts[0]!.availableBudget).toBe(15000n);
  });

  it("throws on empty budget lines", () => {
    expect(() =>
      computeEncumbrance({ encumbrances: [], budgetLines: [], currencyCode: "USD" }),
    ).toThrow("At least one budget line");
  });
});

// ── Scenario Planning ─────────────────────────────────────────────────

describe("computeScenarioPlanning", () => {
  it("applies per-account adjustments", () => {
    const result = computeScenarioPlanning({
      baseline: [
        { accountCode: "4000", accountName: "Revenue", baselineAmount: 100000n },
        { accountCode: "5000", accountName: "COGS", baselineAmount: 60000n },
      ],
      scenarios: [
        {
          scenarioId: "best", name: "Best Case",
          adjustments: [
            { accountCode: "4000", adjustmentBps: 1000 }, // +10%
            { accountCode: "5000", adjustmentBps: -500 }, // -5%
          ],
        },
      ],
      currencyCode: "USD",
    });
    expect(result.result.lines).toHaveLength(2);
    const rev = result.result.lines.find((l) => l.accountCode === "4000")!;
    expect(rev.adjustedAmount).toBe(110000n);
    const cogs = result.result.lines.find((l) => l.accountCode === "5000")!;
    expect(cogs.adjustedAmount).toBe(57000n);
  });

  it("applies global adjustment when no per-account override", () => {
    const result = computeScenarioPlanning({
      baseline: [
        { accountCode: "4000", accountName: "Revenue", baselineAmount: 100000n },
      ],
      scenarios: [
        { scenarioId: "worst", name: "Worst Case", adjustments: [], globalAdjustmentBps: -2000 },
      ],
      currencyCode: "USD",
    });
    // 100000 - 20% = 80000
    expect(result.result.lines[0]!.adjustedAmount).toBe(80000n);
  });

  it("produces summaries per scenario", () => {
    const result = computeScenarioPlanning({
      baseline: [
        { accountCode: "4000", accountName: "Rev", baselineAmount: 50000n },
      ],
      scenarios: [
        { scenarioId: "a", name: "A", adjustments: [], globalAdjustmentBps: 500 },
        { scenarioId: "b", name: "B", adjustments: [], globalAdjustmentBps: -500 },
      ],
      currencyCode: "USD",
    });
    expect(result.result.summaries).toHaveLength(2);
    expect(result.result.summaries[0]!.totalAdjusted).toBe(52500n);
    expect(result.result.summaries[1]!.totalAdjusted).toBe(47500n);
  });

  it("throws on empty baseline", () => {
    expect(() =>
      computeScenarioPlanning({ baseline: [], scenarios: [{ scenarioId: "a", name: "A", adjustments: [] }], currencyCode: "USD" }),
    ).toThrow("At least one baseline");
  });
});

// ── Budget Consolidation ──────────────────────────────────────────────

describe("computeBudgetConsolidation", () => {
  it("aggregates budgets from multiple sources", () => {
    const result = computeBudgetConsolidation({
      sources: [
        { sourceId: "div-a", sourceName: "Division A", accountCode: "6000", accountName: "OpEx", amount: 50000n, currencyCode: "USD" },
        { sourceId: "div-b", sourceName: "Division B", accountCode: "6000", accountName: "OpEx", amount: 30000n, currencyCode: "USD" },
      ],
      eliminations: [],
      targetCurrencyCode: "USD",
    });
    expect(result.result.lines).toHaveLength(1);
    expect(result.result.totalGross).toBe(80000n);
    expect(result.result.totalNet).toBe(80000n);
    expect(result.result.sourceCount).toBe(2);
  });

  it("applies inter-unit eliminations", () => {
    const result = computeBudgetConsolidation({
      sources: [
        { sourceId: "div-a", sourceName: "A", accountCode: "ic-rev", accountName: "IC Revenue", amount: 10000n, currencyCode: "USD" },
        { sourceId: "div-b", sourceName: "B", accountCode: "ic-rev", accountName: "IC Revenue", amount: 10000n, currencyCode: "USD" },
      ],
      eliminations: [
        { accountCode: "ic-rev", sourceId: "div-a", counterpartSourceId: "div-b" },
      ],
      targetCurrencyCode: "USD",
    });
    expect(result.result.totalGross).toBe(20000n);
    expect(result.result.totalEliminations).toBe(10000n);
    expect(result.result.totalNet).toBe(10000n);
  });

  it("throws on empty sources", () => {
    expect(() =>
      computeBudgetConsolidation({ sources: [], eliminations: [], targetCurrencyCode: "USD" }),
    ).toThrow("At least one budget source");
  });
});
