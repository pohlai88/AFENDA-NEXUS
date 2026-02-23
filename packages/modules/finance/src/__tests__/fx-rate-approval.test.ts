import { describe, it, expect } from "vitest";
import {
  requiresApproval,
  validateRateForPosting,
  validateRateSpread,
  DEFAULT_RATE_APPROVAL_POLICY,
} from "../domain/index.js";
import type { FxRateApproval, RateApprovalPolicy } from "../domain/index.js";

describe("requiresApproval (A-21)", () => {
  it("FEED rates never require approval", () => {
    expect(requiresApproval("FEED")).toBe(false);
  });

  it("MANUAL rates require approval by default", () => {
    expect(requiresApproval("MANUAL")).toBe(true);
  });

  it("TRIANGULATED rates do not require approval by default", () => {
    expect(requiresApproval("TRIANGULATED")).toBe(false);
  });

  it("respects custom policy for triangulated rates", () => {
    const policy: RateApprovalPolicy = {
      requireApprovalForManual: true,
      requireApprovalForTriangulated: true,
    };
    expect(requiresApproval("TRIANGULATED", policy)).toBe(true);
  });
});

describe("validateRateForPosting (A-21)", () => {
  const base: Omit<FxRateApproval, "status"> = {
    rateId: "rate-1",
    source: "MANUAL",
    submittedBy: "user-1",
    submittedAt: new Date(),
  };

  it("allows approved manual rates", () => {
    const approval: FxRateApproval = { ...base, status: "APPROVED", reviewedBy: "admin-1", reviewedAt: new Date() };
    expect(validateRateForPosting(approval)).toBeNull();
  });

  it("rejects pending manual rates", () => {
    const approval: FxRateApproval = { ...base, status: "PENDING" };
    const error = validateRateForPosting(approval);
    expect(error).toContain("pending approval");
  });

  it("rejects rejected manual rates with reason", () => {
    const approval: FxRateApproval = { ...base, status: "REJECTED", rejectionReason: "Stale rate" };
    const error = validateRateForPosting(approval);
    expect(error).toContain("rejected");
    expect(error).toContain("Stale rate");
  });

  it("allows feed rates regardless of status", () => {
    const approval: FxRateApproval = { ...base, source: "FEED", status: "PENDING" };
    expect(validateRateForPosting(approval)).toBeNull();
  });
});

describe("validateRateSpread (A-21)", () => {
  const policy: RateApprovalPolicy = {
    requireApprovalForManual: true,
    requireApprovalForTriangulated: false,
    maxSpreadPercent: 5,
  };

  it("allows rates within spread limit", () => {
    expect(validateRateSpread(1.05, 1.02, policy)).toBeNull();
  });

  it("rejects rates exceeding spread limit", () => {
    const error = validateRateSpread(1.10, 1.00, policy);
    expect(error).toContain("exceeds policy limit");
    expect(error).toContain("5%");
  });

  it("returns null when no maxSpreadPercent in policy", () => {
    expect(validateRateSpread(2.0, 1.0, DEFAULT_RATE_APPROVAL_POLICY)).toBeNull();
  });

  it("returns null when reference rate is zero", () => {
    expect(validateRateSpread(1.5, 0, policy)).toBeNull();
  });
});
