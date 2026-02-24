import { describe, it, expect } from "vitest";
import { computeLeaseRecognition } from "../calculators/lease-recognition.js";
import { computeAmortizationSchedule } from "../calculators/amortization-schedule.js";
import { computeLeaseModification } from "../calculators/lease-modification-calc.js";
import { checkLeaseExemptions } from "../calculators/lease-exemptions.js";
import { computeSaleLeaseback } from "../calculators/sale-leaseback.js";
import { classifyLessorLease } from "../calculators/lessor-classification.js";

describe("Lease Calculators", () => {
  describe("computeLeaseRecognition (LA-01)", () => {
    it("computes PV of lease payments for a 24-month lease", () => {
      const result = computeLeaseRecognition({
        leaseTermMonths: 24,
        monthlyPayment: 10000_00n,
        annualDiscountRateBps: 500,
        annualEscalationBps: 0,
        currencyCode: "USD",
      });
      expect(result.leaseLiability).toBeGreaterThan(0n);
      expect(result.rouAsset).toBe(result.leaseLiability);
      expect(result.totalUndiscountedPayments).toBe(24n * 10000_00n);
      expect(result.totalInterest).toBe(result.totalUndiscountedPayments - result.leaseLiability);
      expect(result.currencyCode).toBe("USD");
    });

    it("PV is less than undiscounted total", () => {
      const result = computeLeaseRecognition({
        leaseTermMonths: 60,
        monthlyPayment: 5000_00n,
        annualDiscountRateBps: 800,
        annualEscalationBps: 300,
        currencyCode: "EUR",
      });
      expect(result.leaseLiability).toBeLessThan(result.totalUndiscountedPayments);
      expect(result.totalInterest).toBeGreaterThan(0n);
    });
  });

  describe("computeAmortizationSchedule (LA-02)", () => {
    it("generates correct number of periods", () => {
      const result = computeAmortizationSchedule({
        leaseLiability: 228000_00n,
        leaseTermMonths: 24,
        monthlyPayment: 10000_00n,
        annualDiscountRateBps: 500,
        annualEscalationBps: 0,
        rouAsset: 228000_00n,
        currencyCode: "USD",
      });
      expect(result.lines).toHaveLength(24);
      expect(result.lines[0]!.periodNumber).toBe(1);
      expect(result.lines[23]!.periodNumber).toBe(24);
      expect(result.totalInterest).toBeGreaterThan(0n);
      expect(result.totalDepreciation).toBeGreaterThan(0n);
    });

    it("closing liability decreases over time", () => {
      const result = computeAmortizationSchedule({
        leaseLiability: 100000_00n,
        leaseTermMonths: 12,
        monthlyPayment: 9000_00n,
        annualDiscountRateBps: 600,
        annualEscalationBps: 0,
        rouAsset: 100000_00n,
        currencyCode: "USD",
      });
      for (let i = 1; i < result.lines.length; i++) {
        expect(result.lines[i]!.openingLiability).toBeLessThanOrEqual(result.lines[i - 1]!.openingLiability);
      }
    });
  });

  describe("computeLeaseModification (LA-03)", () => {
    it("computes revised liability on term extension", () => {
      const result = computeLeaseModification({
        currentLiability: 100000_00n,
        remainingTermMonths: 12,
        newTermMonths: 24,
        currentMonthlyPayment: 9000_00n,
        newMonthlyPayment: 9000_00n,
        newDiscountRateBps: 500,
        currencyCode: "USD",
      });
      expect(result.revisedLiability).toBeGreaterThan(0n);
      expect(result.liabilityAdjustment).toBeGreaterThan(0n);
      expect(result.rouAssetAdjustment).toBe(result.liabilityAdjustment);
    });
  });

  describe("checkLeaseExemptions (LA-04)", () => {
    it("identifies short-term lease", () => {
      const result = checkLeaseExemptions({
        leaseTermMonths: 6,
        totalLeasePayments: 30000_00n,
        underlyingAssetFairValue: 50000_00n,
        currencyCode: "USD",
      });
      expect(result.isShortTerm).toBe(true);
      expect(result.isExempt).toBe(true);
    });

    it("identifies low-value lease", () => {
      const result = checkLeaseExemptions({
        leaseTermMonths: 36,
        totalLeasePayments: 3000_00n,
        underlyingAssetFairValue: 4000_00n,
        currencyCode: "USD",
      });
      expect(result.isLowValue).toBe(true);
      expect(result.isExempt).toBe(true);
    });

    it("non-exempt lease", () => {
      const result = checkLeaseExemptions({
        leaseTermMonths: 36,
        totalLeasePayments: 100000_00n,
        underlyingAssetFairValue: 80000_00n,
        currencyCode: "USD",
      });
      expect(result.isExempt).toBe(false);
      expect(result.exemptionReason).toBeNull();
    });
  });

  describe("computeSaleLeaseback (LA-05)", () => {
    it("computes gain on sale at fair value", () => {
      const result = computeSaleLeaseback({
        assetCarryingAmount: 80000_00n,
        salePrice: 100000_00n,
        fairValue: 100000_00n,
        leaseLiability: 50000_00n,
        rouAsset: 50000_00n,
        currencyCode: "USD",
      });
      expect(result.isAtFairValue).toBe(true);
      expect(result.gainOnSale).toBe(20000_00n);
      expect(result.lossOnSale).toBe(0n);
    });

    it("computes loss on sale", () => {
      const result = computeSaleLeaseback({
        assetCarryingAmount: 120000_00n,
        salePrice: 100000_00n,
        fairValue: 100000_00n,
        leaseLiability: 50000_00n,
        rouAsset: 50000_00n,
        currencyCode: "USD",
      });
      expect(result.lossOnSale).toBe(20000_00n);
      expect(result.gainOnSale).toBe(0n);
    });
  });

  describe("classifyLessorLease (LA-06)", () => {
    it("classifies as finance lease when ownership transfers", () => {
      const result = classifyLessorLease({
        leaseTermMonths: 60,
        assetEconomicLifeMonths: 120,
        pvOfLeasePayments: 80000_00n,
        fairValueOfAsset: 100000_00n,
        transfersOwnership: true,
        hasBargainPurchaseOption: false,
        isSpecializedAsset: false,
      });
      expect(result.classification).toBe("FINANCE");
      expect(result.reasons).toContain("Ownership transfers to lessee at end of lease term");
    });

    it("classifies as operating lease when no indicators met", () => {
      const result = classifyLessorLease({
        leaseTermMonths: 12,
        assetEconomicLifeMonths: 120,
        pvOfLeasePayments: 10000_00n,
        fairValueOfAsset: 100000_00n,
        transfersOwnership: false,
        hasBargainPurchaseOption: false,
        isSpecializedAsset: false,
      });
      expect(result.classification).toBe("OPERATING");
    });

    it("classifies as finance when PV is substantially all of fair value", () => {
      const result = classifyLessorLease({
        leaseTermMonths: 60,
        assetEconomicLifeMonths: 120,
        pvOfLeasePayments: 95000_00n,
        fairValueOfAsset: 100000_00n,
        transfersOwnership: false,
        hasBargainPurchaseOption: false,
        isSpecializedAsset: false,
      });
      expect(result.classification).toBe("FINANCE");
      expect(result.substantiallyAllFairValue).toBe(true);
    });
  });
});
