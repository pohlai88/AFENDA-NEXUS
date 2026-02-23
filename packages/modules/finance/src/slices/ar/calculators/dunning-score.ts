/**
 * AR-06: Dunning score calculator.
 * Assigns dunning levels (1-4) based on days overdue and amount.
 * Pure calculator — no DB, no side effects.
 */
import type { DunningLevel } from "../entities/dunning.js";

export interface DunningInput {
  readonly customerId: string;
  readonly invoiceId: string;
  readonly outstandingAmount: bigint;
  readonly dueDate: Date;
  readonly asOfDate: Date;
  readonly previousDunningLevel: DunningLevel | null;
}

export interface DunningResult {
  readonly customerId: string;
  readonly invoiceId: string;
  readonly daysOverdue: number;
  readonly level: DunningLevel;
  readonly escalated: boolean;
}

/**
 * Dunning level thresholds:
 * Level 1: 1-30 days overdue (friendly reminder)
 * Level 2: 31-60 days overdue (formal notice)
 * Level 3: 61-90 days overdue (final demand)
 * Level 4: 90+ days overdue (collection action)
 */
export function computeDunningLevel(daysOverdue: number): DunningLevel {
  if (daysOverdue <= 30) return 1;
  if (daysOverdue <= 60) return 2;
  if (daysOverdue <= 90) return 3;
  return 4;
}

export function computeDunningScore(input: DunningInput): DunningResult | null {
  const daysOverdue = Math.floor(
    (input.asOfDate.getTime() - input.dueDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysOverdue <= 0) return null;

  const level = computeDunningLevel(daysOverdue);
  const escalated = input.previousDunningLevel !== null && level > input.previousDunningLevel;

  return {
    customerId: input.customerId,
    invoiceId: input.invoiceId,
    daysOverdue,
    level,
    escalated,
  };
}

export function computeDunningScores(inputs: readonly DunningInput[]): readonly DunningResult[] {
  return inputs
    .map(computeDunningScore)
    .filter((r): r is DunningResult => r !== null);
}
