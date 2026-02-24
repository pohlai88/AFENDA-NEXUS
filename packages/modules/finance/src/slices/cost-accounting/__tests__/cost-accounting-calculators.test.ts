import { describe, it, expect } from "vitest";
import { computeDirectAllocation } from "../calculators/direct-allocation.js";
import { computeStepDownAllocation } from "../calculators/step-down-allocation.js";
import { computeReciprocalAllocation } from "../calculators/reciprocal-allocation.js";
import { computeActivityBasedCosting } from "../calculators/activity-based-costing.js";
import { computeStandardCostVariance } from "../calculators/standard-cost-variance.js";
import { computeOverheadAbsorption } from "../calculators/overhead-absorption.js";
import { computeProfitability } from "../calculators/profitability-analysis.js";

// ── Direct Allocation ─────────────────────────────────────────────────

describe("computeDirectAllocation", () => {
  it("allocates proportionally by driver quantity", () => {
    const result = computeDirectAllocation({
      pools: [{ sourceCostCenterId: "admin", totalCost: 10000n }],
      targets: [
        { costCenterId: "prod-a", driverQuantity: 60n },
        { costCenterId: "prod-b", driverQuantity: 40n },
      ],
      driverId: "headcount",
      currencyCode: "USD",
    });
    expect(result.totalAllocated).toBe(10000n);
    expect(result.unallocated).toBe(0n);
    expect(result.lines).toHaveLength(2);
    // 60% of 10000 = 6000, 40% = 4000
    const lineA = result.lines.find((l) => l.toCostCenterId === "prod-a");
    const lineB = result.lines.find((l) => l.toCostCenterId === "prod-b");
    expect(lineA!.amount).toBe(6000n);
    expect(lineB!.amount).toBe(4000n);
  });

  it("handles remainder allocation to last target", () => {
    const result = computeDirectAllocation({
      pools: [{ sourceCostCenterId: "admin", totalCost: 10000n }],
      targets: [
        { costCenterId: "a", driverQuantity: 33n },
        { costCenterId: "b", driverQuantity: 33n },
        { costCenterId: "c", driverQuantity: 34n },
      ],
      driverId: "headcount",
      currencyCode: "USD",
    });
    expect(result.totalAllocated).toBe(10000n);
    expect(result.unallocated).toBe(0n);
  });

  it("skips pools with zero cost", () => {
    const result = computeDirectAllocation({
      pools: [
        { sourceCostCenterId: "admin", totalCost: 0n },
        { sourceCostCenterId: "it", totalCost: 5000n },
      ],
      targets: [{ costCenterId: "prod", driverQuantity: 100n }],
      driverId: "headcount",
      currencyCode: "USD",
    });
    expect(result.totalAllocated).toBe(5000n);
    expect(result.lines).toHaveLength(1);
  });

  it("throws on empty pools", () => {
    expect(() =>
      computeDirectAllocation({
        pools: [],
        targets: [{ costCenterId: "a", driverQuantity: 10n }],
        driverId: "d",
        currencyCode: "USD",
      }),
    ).toThrow("At least one allocation pool");
  });

  it("throws on empty targets", () => {
    expect(() =>
      computeDirectAllocation({
        pools: [{ sourceCostCenterId: "a", totalCost: 1000n }],
        targets: [],
        driverId: "d",
        currencyCode: "USD",
      }),
    ).toThrow("At least one allocation target");
  });

  it("throws on zero total driver quantity", () => {
    expect(() =>
      computeDirectAllocation({
        pools: [{ sourceCostCenterId: "a", totalCost: 1000n }],
        targets: [{ costCenterId: "b", driverQuantity: 0n }],
        driverId: "d",
        currencyCode: "USD",
      }),
    ).toThrow("Total driver quantity must be positive");
  });
});

// ── Step-Down Allocation ──────────────────────────────────────────────

describe("computeStepDownAllocation", () => {
  it("allocates in sequence order", () => {
    const result = computeStepDownAllocation({
      pools: [
        { costCenterId: "admin", totalCost: 10000n, sequenceOrder: 1 },
        { costCenterId: "it", totalCost: 5000n, sequenceOrder: 2 },
      ],
      driverRows: [
        { fromCostCenterId: "admin", toCostCenterId: "it", driverQuantity: 30n },
        { fromCostCenterId: "admin", toCostCenterId: "prod", driverQuantity: 70n },
        { fromCostCenterId: "it", toCostCenterId: "prod", driverQuantity: 100n },
      ],
      currencyCode: "USD",
    });
    expect(result.steps).toBe(2);
    expect(result.lines.length).toBeGreaterThanOrEqual(2);
    // Admin allocates to IT and Prod first, then IT (with accumulated) allocates to Prod
    const adminToIt = result.lines.find((l) => l.fromCostCenterId === "admin" && l.toCostCenterId === "it");
    expect(adminToIt).toBeDefined();
    expect(adminToIt!.step).toBe(1);
  });

  it("does not allocate back to already-allocated departments", () => {
    const result = computeStepDownAllocation({
      pools: [
        { costCenterId: "a", totalCost: 1000n, sequenceOrder: 1 },
        { costCenterId: "b", totalCost: 2000n, sequenceOrder: 2 },
      ],
      driverRows: [
        { fromCostCenterId: "a", toCostCenterId: "b", driverQuantity: 50n },
        { fromCostCenterId: "a", toCostCenterId: "c", driverQuantity: 50n },
        { fromCostCenterId: "b", toCostCenterId: "a", driverQuantity: 40n },
        { fromCostCenterId: "b", toCostCenterId: "c", driverQuantity: 60n },
      ],
      currencyCode: "USD",
    });
    // b should NOT allocate back to a (already allocated)
    const bToA = result.lines.find((l) => l.fromCostCenterId === "b" && l.toCostCenterId === "a");
    expect(bToA).toBeUndefined();
  });

  it("throws on empty pools", () => {
    expect(() =>
      computeStepDownAllocation({ pools: [], driverRows: [], currencyCode: "USD" }),
    ).toThrow("At least one allocation pool");
  });
});

// ── Reciprocal Allocation ─────────────────────────────────────────────

describe("computeReciprocalAllocation", () => {
  it("converges for mutual service departments", () => {
    const result = computeReciprocalAllocation({
      pools: [
        { costCenterId: "admin", directCost: 10000n },
        { costCenterId: "it", directCost: 8000n },
      ],
      driverRows: [
        { fromCostCenterId: "admin", toCostCenterId: "it", percentage: 20 },
        { fromCostCenterId: "it", toCostCenterId: "admin", percentage: 10 },
      ],
      currencyCode: "USD",
    });
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThanOrEqual(50);
    expect(result.lines.length).toBe(2);
    expect(result.totalAllocated).toBeGreaterThan(0n);
  });

  it("handles single department (no reciprocal)", () => {
    const result = computeReciprocalAllocation({
      pools: [{ costCenterId: "admin", directCost: 5000n }],
      driverRows: [],
      currencyCode: "USD",
    });
    expect(result.converged).toBe(true);
    expect(result.lines).toHaveLength(0);
  });

  it("throws on empty pools", () => {
    expect(() =>
      computeReciprocalAllocation({ pools: [], driverRows: [], currencyCode: "USD" }),
    ).toThrow("At least one allocation pool");
  });
});

// ── Activity-Based Costing ────────────────────────────────────────────

describe("computeActivityBasedCosting", () => {
  it("allocates costs based on activity consumption", () => {
    const result = computeActivityBasedCosting({
      activities: [
        { activityId: "setup", name: "Machine Setup", totalCost: 50000n, totalDriverQuantity: 100n },
        { activityId: "inspect", name: "Inspection", totalCost: 30000n, totalDriverQuantity: 60n },
      ],
      costObjects: [
        {
          objectId: "product-a", name: "Product A",
          activityConsumption: [
            { activityId: "setup", driverQuantity: 70n },
            { activityId: "inspect", driverQuantity: 20n },
          ],
        },
        {
          objectId: "product-b", name: "Product B",
          activityConsumption: [
            { activityId: "setup", driverQuantity: 30n },
            { activityId: "inspect", driverQuantity: 40n },
          ],
        },
      ],
      currencyCode: "USD",
    });
    expect(result.lines).toHaveLength(4);
    expect(result.costObjectTotals).toHaveLength(2);
    // Product A: setup 70/100*50000=35000, inspect 20/60*30000=10000 → 45000
    const productA = result.costObjectTotals.find((t) => t.objectId === "product-a");
    expect(productA!.totalCost).toBe(45000n);
  });

  it("throws on empty activities", () => {
    expect(() =>
      computeActivityBasedCosting({ activities: [], costObjects: [{ objectId: "a", name: "A", activityConsumption: [] }], currencyCode: "USD" }),
    ).toThrow("At least one activity");
  });
});

// ── Standard Cost Variance ────────────────────────────────────────────

describe("computeStandardCostVariance", () => {
  it("computes all variance types", () => {
    const result = computeStandardCostVariance({
      productId: "widget",
      unitsProduced: 100n,
      material: {
        standardPricePerUnit: 10n,
        standardQtyPerUnit: 5n,
        actualPricePerUnit: 11n,
        actualQtyUsed: 520n,
      },
      labor: {
        standardRatePerHour: 20n,
        standardHoursPerUnit: 2n,
        actualRatePerHour: 21n,
        actualHoursWorked: 210n,
      },
      overhead: {
        standardRatePerUnit: 15n,
        actualOverhead: 1600n,
      },
      currencyCode: "USD",
    });
    expect(result.variances).toHaveLength(5);
    expect(result.variances.map((v) => v.varianceType)).toEqual([
      "MATERIAL_PRICE", "MATERIAL_USAGE", "LABOR_RATE", "LABOR_EFFICIENCY", "OVERHEAD",
    ]);
    // Material Price: (11-10)*520 = 520 unfavorable
    const mpv = result.variances.find((v) => v.varianceType === "MATERIAL_PRICE")!;
    expect(mpv.amount).toBe(520n);
    expect(mpv.favorable).toBe(false);
    // Material Usage: (520-500)*10 = 200 unfavorable
    const muv = result.variances.find((v) => v.varianceType === "MATERIAL_USAGE")!;
    expect(muv.amount).toBe(200n);
    expect(muv.favorable).toBe(false);
  });

  it("detects favorable variances", () => {
    const result = computeStandardCostVariance({
      productId: "widget",
      unitsProduced: 100n,
      material: {
        standardPricePerUnit: 10n,
        standardQtyPerUnit: 5n,
        actualPricePerUnit: 9n,
        actualQtyUsed: 480n,
      },
      labor: {
        standardRatePerHour: 20n,
        standardHoursPerUnit: 2n,
        actualRatePerHour: 19n,
        actualHoursWorked: 190n,
      },
      overhead: {
        standardRatePerUnit: 15n,
        actualOverhead: 1400n,
      },
      currencyCode: "USD",
    });
    expect(result.totalFavorable).toBe(true);
    expect(result.variances.every((v) => v.favorable)).toBe(true);
  });

  it("throws on zero units produced", () => {
    expect(() =>
      computeStandardCostVariance({
        productId: "x",
        unitsProduced: 0n,
        material: { standardPricePerUnit: 1n, standardQtyPerUnit: 1n, actualPricePerUnit: 1n, actualQtyUsed: 1n },
        labor: { standardRatePerHour: 1n, standardHoursPerUnit: 1n, actualRatePerHour: 1n, actualHoursWorked: 1n },
        overhead: { standardRatePerUnit: 1n, actualOverhead: 1n },
        currencyCode: "USD",
      }),
    ).toThrow("Units produced must be positive");
  });
});

// ── Overhead Absorption ───────────────────────────────────────────────

describe("computeOverheadAbsorption", () => {
  it("computes over/under absorption", () => {
    const result = computeOverheadAbsorption({
      budgets: [
        { costCenterId: "factory", budgetedOverhead: 100000n, budgetedBasisQuantity: 10000n, absorptionBasis: "MACHINE_HOURS", currencyCode: "USD" },
      ],
      actuals: [
        { costCenterId: "factory", actualBasisQuantity: 9500n, actualOverhead: 98000n },
      ],
    });
    expect(result.lines).toHaveLength(1);
    // Rate = 100000/10000 = 10 per hour, Applied = 10*9500 = 95000, Actual = 98000
    // Under-absorbed by 3000
    expect(result.lines[0]!.isOverAbsorbed).toBe(false);
    expect(result.totalApplied).toBe(95000n);
    expect(result.totalActual).toBe(98000n);
    expect(result.isNetOverAbsorbed).toBe(false);
  });

  it("detects over-absorption", () => {
    const result = computeOverheadAbsorption({
      budgets: [
        { costCenterId: "factory", budgetedOverhead: 100000n, budgetedBasisQuantity: 10000n, absorptionBasis: "DIRECT_LABOR_HOURS", currencyCode: "USD" },
      ],
      actuals: [
        { costCenterId: "factory", actualBasisQuantity: 11000n, actualOverhead: 105000n },
      ],
    });
    // Applied = 10*11000 = 110000, Actual = 105000 → over-absorbed by 5000
    expect(result.lines[0]!.isOverAbsorbed).toBe(true);
    expect(result.isNetOverAbsorbed).toBe(true);
  });

  it("throws on empty budgets", () => {
    expect(() =>
      computeOverheadAbsorption({ budgets: [], actuals: [] }),
    ).toThrow("At least one overhead budget");
  });
});

// ── Profitability Analysis ────────────────────────────────────────────

describe("computeProfitability", () => {
  it("computes margins by dimension", () => {
    const result = computeProfitability({
      revenueItems: [
        { dimensionId: "prod-a", dimensionType: "PRODUCT", revenue: 100000n },
        { dimensionId: "prod-b", dimensionType: "PRODUCT", revenue: 50000n },
      ],
      costItems: [
        { dimensionId: "prod-a", dimensionType: "PRODUCT", directCost: 60000n, allocatedOverhead: 10000n },
        { dimensionId: "prod-b", dimensionType: "PRODUCT", directCost: 35000n, allocatedOverhead: 8000n },
      ],
      currencyCode: "USD",
    });
    expect(result.lines).toHaveLength(2);
    expect(result.totalRevenue).toBe(150000n);
    expect(result.totalCost).toBe(113000n);
    expect(result.totalGrossMargin).toBe(55000n);
    expect(result.totalNetMargin).toBe(37000n);

    const prodA = result.lines.find((l) => l.dimensionId === "prod-a")!;
    expect(prodA.grossMargin).toBe(40000n);
    expect(prodA.netMargin).toBe(30000n);
    expect(prodA.grossMarginPct).toBeCloseTo(40, 0);
    expect(prodA.netMarginPct).toBeCloseTo(30, 0);
  });

  it("handles dimension with only costs (no revenue)", () => {
    const result = computeProfitability({
      revenueItems: [],
      costItems: [
        { dimensionId: "overhead", dimensionType: "SEGMENT", directCost: 5000n, allocatedOverhead: 2000n },
      ],
      currencyCode: "USD",
    });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]!.revenue).toBe(0n);
    expect(result.lines[0]!.netMargin).toBe(-7000n);
  });

  it("throws on empty input", () => {
    expect(() =>
      computeProfitability({ revenueItems: [], costItems: [], currencyCode: "USD" }),
    ).toThrow("At least one revenue or cost item");
  });
});
