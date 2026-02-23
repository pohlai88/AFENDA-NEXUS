/**
 * @see GL-11 — Budget baseline + budget vs actual
 * @see AIS A-20 — Variance threshold alerts
 *
 * Pure calculator — no I/O, no side effects.
 * Evaluates budget variance rows against configurable thresholds
 * and produces alert entries for accounts that exceed them.
 */
import type { Money } from "@afenda/core";
import type { BudgetVarianceRow } from "../entities/budget.js";
import type { CalculatorResult } from "../../gl/calculators/journal-balance.js";

export type AlertSeverity = "WARNING" | "CRITICAL";

export interface VarianceThreshold {
  readonly percentageWarning: number;
  readonly percentageCritical: number;
  readonly absoluteWarning?: bigint;
  readonly absoluteCritical?: bigint;
}

export interface VarianceAlert {
  readonly accountCode: string;
  readonly accountName: string;
  readonly budgetAmount: Money;
  readonly actualAmount: Money;
  readonly variance: Money;
  readonly variancePercent: number;
  readonly severity: AlertSeverity;
  readonly reason: string;
}

export interface VarianceAlertResult {
  readonly alerts: readonly VarianceAlert[];
  readonly totalChecked: number;
  readonly warningCount: number;
  readonly criticalCount: number;
}

export const DEFAULT_THRESHOLD: VarianceThreshold = {
  percentageWarning: 10,
  percentageCritical: 25,
};

export function evaluateVarianceAlerts(
  rows: readonly BudgetVarianceRow[],
  threshold: VarianceThreshold = DEFAULT_THRESHOLD,
): CalculatorResult<VarianceAlertResult> {
  const alerts: VarianceAlert[] = [];

  for (const row of rows) {
    if (row.budgetAmount.amount === 0n) continue;

    const absVariance = row.variance.amount < 0n ? -row.variance.amount : row.variance.amount;
    const absBudget = row.budgetAmount.amount < 0n ? -row.budgetAmount.amount : row.budgetAmount.amount;

    const pct = absBudget > 0n ? Number((absVariance * 10000n) / absBudget) / 100 : 0;

    let severity: AlertSeverity | null = null;
    let reason = "";

    if (threshold.absoluteCritical && absVariance >= threshold.absoluteCritical) {
      severity = "CRITICAL";
      reason = `Absolute variance ${absVariance} exceeds critical threshold ${threshold.absoluteCritical}`;
    } else if (pct >= threshold.percentageCritical) {
      severity = "CRITICAL";
      reason = `Variance ${pct.toFixed(2)}% exceeds critical threshold ${threshold.percentageCritical}%`;
    } else if (threshold.absoluteWarning && absVariance >= threshold.absoluteWarning) {
      severity = "WARNING";
      reason = `Absolute variance ${absVariance} exceeds warning threshold ${threshold.absoluteWarning}`;
    } else if (pct >= threshold.percentageWarning) {
      severity = "WARNING";
      reason = `Variance ${pct.toFixed(2)}% exceeds warning threshold ${threshold.percentageWarning}%`;
    }

    if (severity) {
      alerts.push({
        accountCode: row.accountCode,
        accountName: row.accountName,
        budgetAmount: row.budgetAmount,
        actualAmount: row.actualAmount,
        variance: row.variance,
        variancePercent: pct,
        severity,
        reason,
      });
    }
  }

  return {
    result: {
      alerts,
      totalChecked: rows.length,
      warningCount: alerts.filter((a) => a.severity === "WARNING").length,
      criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
    },
    inputs: { rowCount: rows.length, threshold },
    explanation: `Checked ${rows.length} rows: ${alerts.length} alerts (${alerts.filter((a) => a.severity === "CRITICAL").length} critical, ${alerts.filter((a) => a.severity === "WARNING").length} warning)`,
  };
}
