import { describe, it, expect } from "vitest";
import { checkCreditLimit } from "../slices/credit/calculators/credit-check.js";
import { computeCreditExposure } from "../slices/credit/calculators/credit-exposure.js";
import { computeEcl } from "../slices/credit/calculators/ecl-calculator.js";

// ─── CM-01: Credit Limit Check ─────────────────────────────────────────────

describe("checkCreditLimit", () => {
  it("approves when within limit", () => {
    const result = checkCreditLimit({
      customerId: "c1",
      currentExposure: 50000n,
      creditLimit: 100000n,
      transactionAmount: 20000n,
      currencyCode: "USD",
    });
    expect(result.decision).toBe("APPROVED");
    expect(result.projectedExposure).toBe(70000n);
    expect(result.headroom).toBe(30000n);
  });

  it("holds when transaction would breach limit", () => {
    const result = checkCreditLimit({
      customerId: "c1",
      currentExposure: 80000n,
      creditLimit: 100000n,
      transactionAmount: 30000n,
      currencyCode: "USD",
    });
    expect(result.decision).toBe("HOLD");
    expect(result.projectedExposure).toBe(110000n);
    expect(result.headroom).toBe(-10000n);
  });

  it("rejects when already over limit", () => {
    const result = checkCreditLimit({
      customerId: "c1",
      currentExposure: 120000n,
      creditLimit: 100000n,
      transactionAmount: 10000n,
      currencyCode: "USD",
    });
    expect(result.decision).toBe("REJECTED");
  });

  it("approves exact limit transaction", () => {
    const result = checkCreditLimit({
      customerId: "c1",
      currentExposure: 50000n,
      creditLimit: 100000n,
      transactionAmount: 50000n,
      currencyCode: "USD",
    });
    expect(result.decision).toBe("APPROVED");
    expect(result.headroom).toBe(0n);
  });
});

// ─── CM-02: Credit Exposure ────────────────────────────────────────────────

describe("computeCreditExposure", () => {
  it("computes exposure from invoices, orders, and payments", () => {
    const result = computeCreditExposure({
      customerId: "c1",
      creditLimit: 100000n,
      currencyCode: "USD",
      items: [
        { documentId: "inv1", documentType: "INVOICE", amount: 30000n, currencyCode: "USD" },
        { documentId: "inv2", documentType: "INVOICE", amount: 20000n, currencyCode: "USD" },
        { documentId: "ord1", documentType: "ORDER", amount: 15000n, currencyCode: "USD" },
        { documentId: "pmt1", documentType: "PAYMENT", amount: 10000n, currencyCode: "USD" },
      ],
    });
    expect(result.totalOutstanding).toBe(50000n);
    expect(result.totalOpenOrders).toBe(15000n);
    expect(result.totalPayments).toBe(10000n);
    // 50,000 + 15,000 - 10,000 = 55,000
    expect(result.currentExposure).toBe(55000n);
    expect(result.availableCredit).toBe(45000n);
    expect(result.isOverLimit).toBe(false);
    expect(result.utilizationPct).toBe(55);
  });

  it("detects over-limit exposure", () => {
    const result = computeCreditExposure({
      customerId: "c1",
      creditLimit: 50000n,
      currencyCode: "USD",
      items: [
        { documentId: "inv1", documentType: "INVOICE", amount: 60000n, currencyCode: "USD" },
      ],
    });
    expect(result.isOverLimit).toBe(true);
    expect(result.utilizationPct).toBe(120);
  });

  it("handles zero credit limit", () => {
    const result = computeCreditExposure({
      customerId: "c1",
      creditLimit: 0n,
      currencyCode: "USD",
      items: [
        { documentId: "inv1", documentType: "INVOICE", amount: 1000n, currencyCode: "USD" },
      ],
    });
    expect(result.isOverLimit).toBe(true);
    expect(result.utilizationPct).toBe(999);
  });

  it("handles empty items", () => {
    const result = computeCreditExposure({
      customerId: "c1",
      creditLimit: 100000n,
      currencyCode: "USD",
      items: [],
    });
    expect(result.currentExposure).toBe(0n);
    expect(result.availableCredit).toBe(100000n);
    expect(result.utilizationPct).toBe(0);
  });
});

// ─── CM-06: ECL Calculator ─────────────────────────────────────────────────

describe("computeEcl", () => {
  it("computes ECL from aging buckets", () => {
    const result = computeEcl({
      customerId: "c1",
      buckets: [
        { label: "Current", amount: 100000n, lossRateBps: 50 },       // 0.5%
        { label: "30 days", amount: 50000n, lossRateBps: 200 },       // 2%
        { label: "60 days", amount: 20000n, lossRateBps: 500 },       // 5%
        { label: "90+ days", amount: 10000n, lossRateBps: 2000 },     // 20%
      ],
      currencyCode: "USD",
    });
    // Current: 100,000 * 50/10000 = 500
    // 30 days: 50,000 * 200/10000 = 1,000
    // 60 days: 20,000 * 500/10000 = 1,000
    // 90+ days: 10,000 * 2000/10000 = 2,000
    // Total ECL = 4,500
    expect(result.totalGross).toBe(180000n);
    expect(result.totalEcl).toBe(4500n);
    expect(result.netCarryingAmount).toBe(175500n);
    expect(result.buckets).toHaveLength(4);
    expect(result.buckets[0]!.eclAmount).toBe(500n);
    expect(result.buckets[3]!.eclAmount).toBe(2000n);
  });

  it("handles zero gross amount", () => {
    const result = computeEcl({
      customerId: "c1",
      buckets: [],
      currencyCode: "USD",
    });
    expect(result.totalEcl).toBe(0n);
    expect(result.weightedLossRateBps).toBe(0);
  });

  it("computes weighted loss rate", () => {
    const result = computeEcl({
      customerId: "c1",
      buckets: [
        { label: "Current", amount: 100000n, lossRateBps: 100 },  // 1%
      ],
      currencyCode: "USD",
    });
    // ECL = 100,000 * 100/10000 = 1,000
    // Weighted rate = 1,000 * 10000 / 100,000 = 100 bps
    expect(result.weightedLossRateBps).toBe(100);
  });
});
