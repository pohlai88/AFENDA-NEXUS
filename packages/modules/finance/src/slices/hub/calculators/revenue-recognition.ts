/**
 * @see AH-04 — Revenue recognition schedules
 * @see AIS A-24 — Revenue recognition service
 *
 * Pure calculator — no I/O, no side effects.
 * Computes a straight-line recognition schedule for a revenue contract,
 * distributing the total amount evenly across periods.
 */
import type { Money } from "@afenda/core";
import { money } from "@afenda/core";
import type { RecognitionScheduleEntry } from "../entities/revenue-recognition.js";
import type { CalculatorResult } from "../../gl/calculators/journal-balance.js";

export interface RecognitionScheduleInput {
  readonly totalAmount: bigint;
  readonly periodCount: number;
  readonly currency: string;
  readonly alreadyRecognized: bigint;
}

export interface RecognitionScheduleResult {
  readonly entries: readonly RecognitionScheduleEntry[];
  readonly totalToRecognize: Money;
  readonly remainingToRecognize: Money;
  readonly perPeriodAmount: Money;
}

/**
 * Computes a straight-line recognition schedule.
 * Distributes totalAmount evenly across periodCount periods.
 * Any remainder from integer division is added to the final period.
 */
export function computeStraightLineSchedule(
  input: RecognitionScheduleInput,
): CalculatorResult<RecognitionScheduleResult> {
  const { totalAmount, periodCount, currency, alreadyRecognized } = input;

  if (periodCount <= 0) {
    return {
      result: {
        entries: [],
        totalToRecognize: money(totalAmount, currency),
        remainingToRecognize: money(totalAmount - alreadyRecognized, currency),
        perPeriodAmount: money(0n, currency),
      },
      inputs: { ...input },
      explanation: "No periods specified",
    };
  }

  const perPeriod = totalAmount / BigInt(periodCount);
  const remainder = totalAmount - perPeriod * BigInt(periodCount);

  const entries: RecognitionScheduleEntry[] = [];
  let cumulative = 0n;

  for (let i = 0; i < periodCount; i++) {
    const isLast = i === periodCount - 1;
    const amount = isLast ? perPeriod + remainder : perPeriod;
    cumulative += amount;
    entries.push({
      periodId: `period-${i + 1}`,
      amount,
      cumulativeAmount: cumulative,
      isRecognized: cumulative <= alreadyRecognized,
    });
  }

  const remaining = totalAmount - alreadyRecognized;

  return {
    result: {
      entries,
      totalToRecognize: money(totalAmount, currency),
      remainingToRecognize: money(remaining > 0n ? remaining : 0n, currency),
      perPeriodAmount: money(perPeriod, currency),
    },
    inputs: { ...input },
    explanation: `Straight-line: ${totalAmount} over ${periodCount} periods = ${perPeriod}/period, remainder ${remainder} in last period, ${remaining} remaining`,
  };
}

export interface MilestoneInput {
  readonly description: string;
  readonly amount: bigint;
  readonly isCompleted: boolean;
}

export interface MilestoneScheduleResult {
  readonly completedAmount: Money;
  readonly pendingAmount: Money;
  readonly completedCount: number;
  readonly totalCount: number;
}

/**
 * Computes milestone-based recognition totals.
 * Revenue is recognized only when milestones are completed.
 */
export function computeMilestoneRecognition(
  milestones: readonly MilestoneInput[],
  currency: string,
): CalculatorResult<MilestoneScheduleResult> {
  let completedAmount = 0n;
  let pendingAmount = 0n;
  let completedCount = 0;

  for (const m of milestones) {
    if (m.isCompleted) {
      completedAmount += m.amount;
      completedCount++;
    } else {
      pendingAmount += m.amount;
    }
  }

  return {
    result: {
      completedAmount: money(completedAmount, currency),
      pendingAmount: money(pendingAmount, currency),
      completedCount,
      totalCount: milestones.length,
    },
    inputs: { milestoneCount: milestones.length, currency },
    explanation: `Milestones: ${completedCount}/${milestones.length} completed, ${completedAmount} recognized, ${pendingAmount} pending`,
  };
}
