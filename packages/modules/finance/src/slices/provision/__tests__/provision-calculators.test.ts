import { describe, it, expect } from "vitest";
import { checkRecognitionCriteria } from "../calculators/recognition-criteria.js";
import { computeDiscountUnwind } from "../calculators/discount-unwind.js";
import { computeOnerousContract } from "../calculators/onerous-contract.js";

describe("Provision Calculators", () => {
  describe("checkRecognitionCriteria (PR-01)", () => {
    it("recognises provision when all IAS 37 criteria met", () => {
      const result = checkRecognitionCriteria({
        hasPresentObligation: true,
        isProbableOutflow: true,
        canReliablyEstimate: true,
        estimatedAmount: 500000_00n,
        description: "Legal claim",
      });
      expect(result.shouldRecognize).toBe(true);
      expect(result.isContingentLiability).toBe(false);
    });

    it("does not recognise when no present obligation", () => {
      const result = checkRecognitionCriteria({
        hasPresentObligation: false,
        isProbableOutflow: true,
        canReliablyEstimate: true,
        estimatedAmount: 500000_00n,
        description: "Legal claim",
      });
      expect(result.shouldRecognize).toBe(false);
    });

    it("does not recognise when outflow not probable", () => {
      const result = checkRecognitionCriteria({
        hasPresentObligation: true,
        isProbableOutflow: false,
        canReliablyEstimate: true,
        estimatedAmount: 500000_00n,
        description: "Legal claim",
      });
      expect(result.shouldRecognize).toBe(false);
      expect(result.isContingentLiability).toBe(true);
    });

    it("does not recognise when cannot reliably estimate", () => {
      const result = checkRecognitionCriteria({
        hasPresentObligation: true,
        isProbableOutflow: true,
        canReliablyEstimate: false,
        estimatedAmount: 500000_00n,
        description: "Legal claim",
      });
      expect(result.shouldRecognize).toBe(false);
    });
  });

  describe("computeDiscountUnwind (PR-02)", () => {
    it("computes unwind amount for a discounted provision", () => {
      const result = computeDiscountUnwind({
        currentAmount: 1000000_00n,
        discountRateBps: 500,
        periodsRemaining: 5,
        currencyCode: "USD",
      });
      expect(result.unwindAmount).toBeGreaterThan(0n);
      expect(result.newBalance).toBe(1000000_00n + result.unwindAmount);
      expect(result.presentValue).toBeLessThan(1000000_00n);
      expect(result.currencyCode).toBe("USD");
    });

    it("returns zero unwind when discount rate is zero", () => {
      const result = computeDiscountUnwind({
        currentAmount: 1000000_00n,
        discountRateBps: 0,
        periodsRemaining: 5,
        currencyCode: "USD",
      });
      expect(result.unwindAmount).toBe(0n);
      expect(result.newBalance).toBe(1000000_00n);
    });

    it("returns zero unwind when no periods remaining", () => {
      const result = computeDiscountUnwind({
        currentAmount: 1000000_00n,
        discountRateBps: 500,
        periodsRemaining: 0,
        currencyCode: "USD",
      });
      expect(result.unwindAmount).toBe(0n);
    });
  });

  describe("computeOnerousContract (PR-04)", () => {
    it("recognises onerous contract when costs exceed benefits", () => {
      const result = computeOnerousContract({
        contractId: "contract-1",
        expectedCosts: 150000_00n,
        expectedBenefits: 100000_00n,
        unavoidableCosts: 150000_00n,
        currencyCode: "USD",
      });
      expect(result.isOnerous).toBe(true);
      expect(result.provisionAmount).toBe(50000_00n);
    });

    it("does not recognise when benefits exceed costs", () => {
      const result = computeOnerousContract({
        contractId: "contract-2",
        expectedCosts: 150000_00n,
        expectedBenefits: 200000_00n,
        unavoidableCosts: 150000_00n,
        currencyCode: "USD",
      });
      expect(result.isOnerous).toBe(false);
      expect(result.provisionAmount).toBe(0n);
    });

    it("does not recognise when costs equal benefits", () => {
      const result = computeOnerousContract({
        contractId: "contract-3",
        expectedCosts: 150000_00n,
        expectedBenefits: 150000_00n,
        unavoidableCosts: 150000_00n,
        currencyCode: "USD",
      });
      expect(result.isOnerous).toBe(false);
      expect(result.provisionAmount).toBe(0n);
    });
  });
});
