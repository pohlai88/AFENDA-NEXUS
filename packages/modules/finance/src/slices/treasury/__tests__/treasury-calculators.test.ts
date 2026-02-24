import { describe, it, expect } from "vitest";
import { computeCashFlowForecast } from "../calculators/cash-flow-forecast.js";
import { computeCashPooling } from "../calculators/cash-pooling.js";
import { testCovenant } from "../calculators/covenant-monitor.js";
import { computeFxExposure } from "../calculators/fx-exposure.js";

describe("Treasury Calculators", () => {
  describe("computeCashFlowForecast (TR-01)", () => {
    it("returns empty periods for no items", () => {
      const result = computeCashFlowForecast([], 100000_00n, 30, "USD");
      expect(result.periods).toHaveLength(0);
      expect(result.totalNetCashFlow).toBe(0n);
    });

    it("aggregates receipts and payments into periods", () => {
      const baseDate = new Date("2026-03-01");
      const items = [
        { forecastDate: baseDate, forecastType: "RECEIPTS" as const, amount: 50000_00n, probability: 100, currencyCode: "USD" },
        { forecastDate: baseDate, forecastType: "PAYMENTS" as const, amount: 20000_00n, probability: 100, currencyCode: "USD" },
      ];
      const result = computeCashFlowForecast(items, 100000_00n, 30, "USD");
      expect(result.periods.length).toBeGreaterThanOrEqual(1);
      expect(result.totalExpectedReceipts).toBe(50000_00n);
      expect(result.totalExpectedPayments).toBe(20000_00n);
      expect(result.totalNetCashFlow).toBe(30000_00n);
    });

    it("applies probability weighting", () => {
      const baseDate = new Date("2026-03-01");
      const items = [
        { forecastDate: baseDate, forecastType: "RECEIPTS" as const, amount: 100000_00n, probability: 50, currencyCode: "USD" },
      ];
      const result = computeCashFlowForecast(items, 0n, 30, "USD");
      expect(result.totalExpectedReceipts).toBe(50000_00n);
    });

    it("tracks opening and closing balances across periods", () => {
      const d1 = new Date("2026-03-01");
      const d2 = new Date("2026-04-01");
      const items = [
        { forecastDate: d1, forecastType: "RECEIPTS" as const, amount: 10000_00n, probability: 100, currencyCode: "USD" },
        { forecastDate: d2, forecastType: "PAYMENTS" as const, amount: 5000_00n, probability: 100, currencyCode: "USD" },
      ];
      const result = computeCashFlowForecast(items, 50000_00n, 30, "USD");
      expect(result.periods[0]!.openingBalance).toBe(50000_00n);
      if (result.periods.length > 1) {
        expect(result.periods[1]!.openingBalance).toBe(result.periods[0]!.closingBalance);
      }
    });
  });

  describe("computeCashPooling (TR-02)", () => {
    it("computes net position across accounts", () => {
      const accounts = [
        { accountId: "a1", companyId: "c1", balance: 100000_00n, currencyCode: "USD" },
        { accountId: "a2", companyId: "c2", balance: -30000_00n, currencyCode: "USD" },
        { accountId: "a3", companyId: "c3", balance: 50000_00n, currencyCode: "USD" },
      ];
      const result = computeCashPooling(accounts, "USD");
      expect(result.netPosition).toBe(120000_00n);
      expect(result.totalPositive).toBe(150000_00n);
      expect(result.totalNegative).toBe(-30000_00n);
      expect(result.interestSavingBps).toBe(75);
    });

    it("returns zero savings when no negative balances", () => {
      const accounts = [
        { accountId: "a1", companyId: "c1", balance: 100000_00n, currencyCode: "USD" },
      ];
      const result = computeCashPooling(accounts, "USD");
      expect(result.interestSavingBps).toBe(0);
    });
  });

  describe("testCovenant (TR-04)", () => {
    it("returns COMPLIANT when above minimum threshold with headroom", () => {
      const result = testCovenant({
        covenantId: "cov-1",
        covenantType: "DEBT_SERVICE_COVERAGE",
        thresholdValue: 1.5,
        currentValue: 2.0,
        isMinimumThreshold: true,
      });
      expect(result.status).toBe("COMPLIANT");
      expect(result.headroom).toBeCloseTo(0.5);
      expect(result.breachAmount).toBe(0);
    });

    it("returns BREACHED when below minimum threshold", () => {
      const result = testCovenant({
        covenantId: "cov-2",
        covenantType: "CURRENT_RATIO",
        thresholdValue: 1.5,
        currentValue: 1.2,
        isMinimumThreshold: true,
      });
      expect(result.status).toBe("BREACHED");
      expect(result.breachAmount).toBeCloseTo(0.3);
    });

    it("returns WARNING when close to threshold", () => {
      const result = testCovenant({
        covenantId: "cov-3",
        covenantType: "LEVERAGE_RATIO",
        thresholdValue: 3.0,
        currentValue: 2.8,
        isMinimumThreshold: false,
      });
      expect(result.status).toBe("WARNING");
    });

    it("returns BREACHED for maximum threshold exceeded", () => {
      const result = testCovenant({
        covenantId: "cov-4",
        covenantType: "LEVERAGE_RATIO",
        thresholdValue: 3.0,
        currentValue: 3.5,
        isMinimumThreshold: false,
      });
      expect(result.status).toBe("BREACHED");
      expect(result.breachAmount).toBeCloseTo(0.5);
    });
  });

  describe("computeFxExposure (TR-05)", () => {
    it("aggregates exposures by currency excluding base", () => {
      const items = [
        { companyId: "c1", currencyCode: "EUR", receivables: 100000_00n, payables: 30000_00n, forecasts: 0n },
        { companyId: "c1", currencyCode: "GBP", receivables: 50000_00n, payables: 80000_00n, forecasts: 0n },
        { companyId: "c1", currencyCode: "USD", receivables: 200000_00n, payables: 100000_00n, forecasts: 0n },
      ];
      const result = computeFxExposure(items, "USD");
      expect(result.exposures).toHaveLength(2);
      const eur = result.exposures.find((e) => e.currencyCode === "EUR")!;
      expect(eur.grossLong).toBe(100000_00n);
      expect(eur.grossShort).toBe(30000_00n);
      expect(eur.netExposure).toBe(70000_00n);
    });

    it("handles positive and negative forecasts", () => {
      const items = [
        { companyId: "c1", currencyCode: "EUR", receivables: 0n, payables: 0n, forecasts: 50000_00n },
        { companyId: "c2", currencyCode: "EUR", receivables: 0n, payables: 0n, forecasts: -20000_00n },
      ];
      const result = computeFxExposure(items, "USD");
      const eur = result.exposures.find((e) => e.currencyCode === "EUR")!;
      expect(eur.grossLong).toBe(50000_00n);
      expect(eur.grossShort).toBe(20000_00n);
    });

    it("returns empty exposures when all in base currency", () => {
      const items = [
        { companyId: "c1", currencyCode: "USD", receivables: 100000_00n, payables: 50000_00n, forecasts: 0n },
      ];
      const result = computeFxExposure(items, "USD");
      expect(result.exposures).toHaveLength(0);
      expect(result.totalNetExposure).toBe(0n);
    });
  });
});
