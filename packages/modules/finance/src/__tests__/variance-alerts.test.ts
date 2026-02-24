import { describe, it, expect } from "vitest";
import { money } from "@afenda/core";
import { evaluateVarianceAlerts, DEFAULT_THRESHOLD } from "../slices/hub/calculators/variance-alerts.js";
import type { BudgetVarianceRow } from "../slices/hub/entities/budget.js";

function makeRow(overrides: Partial<BudgetVarianceRow> & { code: string; budget: bigint; actual: bigint }): BudgetVarianceRow {
  const variance = overrides.actual - overrides.budget;
  return {
    accountCode: overrides.code,
    accountName: overrides.accountName ?? `Account ${overrides.code}`,
    budgetAmount: money(overrides.budget, "USD"),
    actualAmount: money(overrides.actual, "USD"),
    variance: money(variance, "USD"),
  };
}

describe("evaluateVarianceAlerts (A-20)", () => {
  it("returns no alerts when variance is within threshold", () => {
    const rows: BudgetVarianceRow[] = [
      makeRow({ code: "5000", budget: 10000n, actual: 10500n }),
    ];
    const { result } = evaluateVarianceAlerts(rows);
    expect(result.alerts).toHaveLength(0);
    expect(result.totalChecked).toBe(1);
  });

  it("flags WARNING when variance exceeds percentage warning threshold", () => {
    const rows: BudgetVarianceRow[] = [
      makeRow({ code: "5000", budget: 10000n, actual: 11500n }),
    ];
    const { result } = evaluateVarianceAlerts(rows);
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]!.severity).toBe("WARNING");
    expect(result.warningCount).toBe(1);
    expect(result.criticalCount).toBe(0);
  });

  it("flags CRITICAL when variance exceeds percentage critical threshold", () => {
    const rows: BudgetVarianceRow[] = [
      makeRow({ code: "5000", budget: 10000n, actual: 13000n }),
    ];
    const { result } = evaluateVarianceAlerts(rows);
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]!.severity).toBe("CRITICAL");
    expect(result.criticalCount).toBe(1);
  });

  it("supports custom thresholds", () => {
    const rows: BudgetVarianceRow[] = [
      makeRow({ code: "5000", budget: 10000n, actual: 10600n }),
    ];
    const { result } = evaluateVarianceAlerts(rows, {
      percentageWarning: 5,
      percentageCritical: 15,
    });
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]!.severity).toBe("WARNING");
  });

  it("supports absolute thresholds", () => {
    const rows: BudgetVarianceRow[] = [
      makeRow({ code: "5000", budget: 100000n, actual: 100500n }),
    ];
    const { result } = evaluateVarianceAlerts(rows, {
      percentageWarning: 10,
      percentageCritical: 25,
      absoluteWarning: 400n,
      absoluteCritical: 1000n,
    });
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]!.severity).toBe("WARNING");
    expect(result.alerts[0]!.reason).toContain("Absolute variance");
  });

  it("skips zero-budget rows", () => {
    const rows: BudgetVarianceRow[] = [
      makeRow({ code: "5000", budget: 0n, actual: 5000n }),
    ];
    const { result } = evaluateVarianceAlerts(rows);
    expect(result.alerts).toHaveLength(0);
  });

  it("handles multiple rows with mixed severities", () => {
    const rows: BudgetVarianceRow[] = [
      makeRow({ code: "5000", budget: 10000n, actual: 10200n }),
      makeRow({ code: "5100", budget: 10000n, actual: 11500n }),
      makeRow({ code: "5200", budget: 10000n, actual: 14000n }),
    ];
    const { result } = evaluateVarianceAlerts(rows);
    expect(result.totalChecked).toBe(3);
    expect(result.warningCount).toBe(1);
    expect(result.criticalCount).toBe(1);
    expect(result.alerts).toHaveLength(2);
  });

  it("DEFAULT_THRESHOLD has sensible defaults", () => {
    expect(DEFAULT_THRESHOLD.percentageWarning).toBe(10);
    expect(DEFAULT_THRESHOLD.percentageCritical).toBe(25);
  });
});
