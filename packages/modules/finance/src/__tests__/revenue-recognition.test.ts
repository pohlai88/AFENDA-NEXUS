import { describe, it, expect } from "vitest";
import {
  computeStraightLineSchedule,
  computeMilestoneRecognition,
} from "../domain/index.js";
import type { MilestoneInput } from "../domain/index.js";

describe("computeStraightLineSchedule (A-24)", () => {
  it("distributes amount evenly across periods", () => {
    const { result } = computeStraightLineSchedule({
      totalAmount: 120000n,
      periodCount: 12,
      currency: "USD",
      alreadyRecognized: 0n,
    });
    expect(result.entries).toHaveLength(12);
    expect(result.perPeriodAmount.amount).toBe(10000n);
    expect(result.totalToRecognize.amount).toBe(120000n);
    expect(result.remainingToRecognize.amount).toBe(120000n);
  });

  it("puts remainder in the last period", () => {
    const { result } = computeStraightLineSchedule({
      totalAmount: 100000n,
      periodCount: 3,
      currency: "USD",
      alreadyRecognized: 0n,
    });
    expect(result.entries).toHaveLength(3);
    expect(result.entries[0]!.amount).toBe(33333n);
    expect(result.entries[1]!.amount).toBe(33333n);
    expect(result.entries[2]!.amount).toBe(33334n);
    expect(result.entries[2]!.cumulativeAmount).toBe(100000n);
  });

  it("marks entries as recognized up to alreadyRecognized", () => {
    const { result } = computeStraightLineSchedule({
      totalAmount: 40000n,
      periodCount: 4,
      currency: "USD",
      alreadyRecognized: 20000n,
    });
    expect(result.entries[0]!.isRecognized).toBe(true);
    expect(result.entries[1]!.isRecognized).toBe(true);
    expect(result.entries[2]!.isRecognized).toBe(false);
    expect(result.entries[3]!.isRecognized).toBe(false);
    expect(result.remainingToRecognize.amount).toBe(20000n);
  });

  it("handles zero periods gracefully", () => {
    const { result } = computeStraightLineSchedule({
      totalAmount: 50000n,
      periodCount: 0,
      currency: "USD",
      alreadyRecognized: 0n,
    });
    expect(result.entries).toHaveLength(0);
    expect(result.perPeriodAmount.amount).toBe(0n);
  });

  it("clamps remaining to zero when fully recognized", () => {
    const { result } = computeStraightLineSchedule({
      totalAmount: 10000n,
      periodCount: 2,
      currency: "USD",
      alreadyRecognized: 10000n,
    });
    expect(result.remainingToRecognize.amount).toBe(0n);
  });
});

describe("computeMilestoneRecognition (A-24)", () => {
  it("sums completed milestones", () => {
    const milestones: MilestoneInput[] = [
      { description: "Phase 1", amount: 30000n, isCompleted: true },
      { description: "Phase 2", amount: 50000n, isCompleted: true },
      { description: "Phase 3", amount: 20000n, isCompleted: false },
    ];
    const { result } = computeMilestoneRecognition(milestones, "USD");
    expect(result.completedAmount.amount).toBe(80000n);
    expect(result.pendingAmount.amount).toBe(20000n);
    expect(result.completedCount).toBe(2);
    expect(result.totalCount).toBe(3);
  });

  it("handles all completed milestones", () => {
    const milestones: MilestoneInput[] = [
      { description: "M1", amount: 10000n, isCompleted: true },
      { description: "M2", amount: 20000n, isCompleted: true },
    ];
    const { result } = computeMilestoneRecognition(milestones, "USD");
    expect(result.completedAmount.amount).toBe(30000n);
    expect(result.pendingAmount.amount).toBe(0n);
    expect(result.completedCount).toBe(2);
  });

  it("handles no completed milestones", () => {
    const milestones: MilestoneInput[] = [
      { description: "M1", amount: 10000n, isCompleted: false },
    ];
    const { result } = computeMilestoneRecognition(milestones, "USD");
    expect(result.completedAmount.amount).toBe(0n);
    expect(result.pendingAmount.amount).toBe(10000n);
    expect(result.completedCount).toBe(0);
  });

  it("handles empty milestones", () => {
    const { result } = computeMilestoneRecognition([], "EUR");
    expect(result.completedAmount.amount).toBe(0n);
    expect(result.pendingAmount.amount).toBe(0n);
    expect(result.totalCount).toBe(0);
  });
});
