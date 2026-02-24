/**
 * BG-03: Scenario planning calculator.
 * Computes budget impact under different scenarios (best case, worst case,
 * most likely) by applying adjustment factors to baseline budget.
 * Pure calculator — no DB, no side effects.
 */

import type { CalculatorResult } from "../../../shared/types.js";

export interface ScenarioAdjustment {
  readonly accountCode: string;
  readonly adjustmentBps: number;
}

export interface ScenarioDefinition {
  readonly scenarioId: string;
  readonly name: string;
  readonly adjustments: readonly ScenarioAdjustment[];
  readonly globalAdjustmentBps?: number;
}

export interface BaselineBudgetLine {
  readonly accountCode: string;
  readonly accountName: string;
  readonly baselineAmount: bigint;
}

export interface ScenarioPlanningInput {
  readonly baseline: readonly BaselineBudgetLine[];
  readonly scenarios: readonly ScenarioDefinition[];
  readonly currencyCode: string;
}

export interface ScenarioLine {
  readonly scenarioId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly baselineAmount: bigint;
  readonly adjustedAmount: bigint;
  readonly delta: bigint;
  readonly adjustmentBps: number;
}

export interface ScenarioSummary {
  readonly scenarioId: string;
  readonly name: string;
  readonly totalBaseline: bigint;
  readonly totalAdjusted: bigint;
  readonly totalDelta: bigint;
  readonly lineCount: number;
}

export interface ScenarioPlanningResult {
  readonly lines: readonly ScenarioLine[];
  readonly summaries: readonly ScenarioSummary[];
  readonly currencyCode: string;
}

/**
 * Compute scenario-adjusted budgets.
 */
export function computeScenarioPlanning(
  input: ScenarioPlanningInput,
): CalculatorResult<ScenarioPlanningResult> {
  if (input.baseline.length === 0) throw new Error("At least one baseline budget line is required");
  if (input.scenarios.length === 0) throw new Error("At least one scenario is required");

  const lines: ScenarioLine[] = [];
  const summaries: ScenarioSummary[] = [];

  for (const scenario of input.scenarios) {
    const adjMap = new Map<string, number>();
    for (const adj of scenario.adjustments) {
      adjMap.set(adj.accountCode, adj.adjustmentBps);
    }

    let totalBaseline = 0n;
    let totalAdjusted = 0n;
    let lineCount = 0;

    for (const bl of input.baseline) {
      const bps = adjMap.get(bl.accountCode) ?? scenario.globalAdjustmentBps ?? 0;
      const adjustedAmount = bl.baselineAmount + (bl.baselineAmount * BigInt(bps)) / 10000n;
      const delta = adjustedAmount - bl.baselineAmount;

      lines.push({
        scenarioId: scenario.scenarioId,
        accountCode: bl.accountCode,
        accountName: bl.accountName,
        baselineAmount: bl.baselineAmount,
        adjustedAmount,
        delta,
        adjustmentBps: bps,
      });

      totalBaseline += bl.baselineAmount;
      totalAdjusted += adjustedAmount;
      lineCount++;
    }

    summaries.push({
      scenarioId: scenario.scenarioId,
      name: scenario.name,
      totalBaseline,
      totalAdjusted,
      totalDelta: totalAdjusted - totalBaseline,
      lineCount,
    });
  }

  return {
    result: { lines, summaries, currencyCode: input.currencyCode },
    inputs: { baselineCount: input.baseline.length, scenarioCount: input.scenarios.length },
    explanation: `Scenario planning: ${input.scenarios.length} scenarios × ${input.baseline.length} accounts = ${lines.length} lines`,
  };
}
