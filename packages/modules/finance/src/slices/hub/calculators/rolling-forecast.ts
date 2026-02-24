/**
 * BG-01: Rolling forecast calculator.
 * Extends the budget horizon by dropping the oldest completed period
 * and appending a new forecast period. Supports trend-based and
 * manual override forecasting methods.
 * Pure calculator — no DB, no side effects.
 */

import type { CalculatorResult } from "../../../shared/types.js";

export type ForecastMethod = "TREND" | "AVERAGE" | "MANUAL" | "GROWTH_RATE";

export interface HistoricalPeriod {
  readonly periodId: string;
  readonly accountCode: string;
  readonly actualAmount: bigint;
}

export interface ForecastOverride {
  readonly accountCode: string;
  readonly amount: bigint;
}

export interface RollingForecastInput {
  readonly historicalPeriods: readonly HistoricalPeriod[];
  readonly method: ForecastMethod;
  readonly periodsToForecast: number;
  readonly growthRateBps?: number;
  readonly overrides?: readonly ForecastOverride[];
  readonly currencyCode: string;
}

export interface ForecastLine {
  readonly accountCode: string;
  readonly forecastPeriodIndex: number;
  readonly forecastAmount: bigint;
  readonly method: ForecastMethod;
  readonly isOverride: boolean;
}

export interface RollingForecastResult {
  readonly lines: readonly ForecastLine[];
  readonly totalForecast: bigint;
  readonly periodsForecasted: number;
  readonly accountCount: number;
  readonly currencyCode: string;
}

/**
 * Generate rolling forecast for future periods based on historical data.
 */
export function computeRollingForecast(
  input: RollingForecastInput,
): CalculatorResult<RollingForecastResult> {
  if (input.periodsToForecast <= 0) throw new Error("periodsToForecast must be positive");
  if (input.historicalPeriods.length === 0) throw new Error("At least one historical period is required");

  // Group historical data by account
  const byAccount = new Map<string, bigint[]>();
  for (const hp of input.historicalPeriods) {
    const arr = byAccount.get(hp.accountCode) ?? [];
    arr.push(hp.actualAmount);
    byAccount.set(hp.accountCode, arr);
  }

  const overrideMap = new Map<string, bigint>();
  for (const o of input.overrides ?? []) {
    overrideMap.set(o.accountCode, o.amount);
  }

  const lines: ForecastLine[] = [];
  let totalForecast = 0n;

  for (const [accountCode, actuals] of byAccount) {
    for (let idx = 0; idx < input.periodsToForecast; idx++) {
      const override = overrideMap.get(accountCode);
      if (override !== undefined) {
        lines.push({
          accountCode,
          forecastPeriodIndex: idx,
          forecastAmount: override,
          method: "MANUAL",
          isOverride: true,
        });
        totalForecast += override;
        continue;
      }

      let forecastAmount: bigint;

      switch (input.method) {
        case "TREND": {
          // Simple linear trend: use last value + average delta
          if (actuals.length < 2) {
            forecastAmount = actuals[actuals.length - 1]!;
          } else {
            const deltas: bigint[] = [];
            for (let i = 1; i < actuals.length; i++) {
              deltas.push(actuals[i]! - actuals[i - 1]!);
            }
            const avgDelta = deltas.reduce((s, d) => s + d, 0n) / BigInt(deltas.length);
            forecastAmount = actuals[actuals.length - 1]! + avgDelta * BigInt(idx + 1);
          }
          break;
        }
        case "AVERAGE": {
          const sum = actuals.reduce((s, a) => s + a, 0n);
          forecastAmount = sum / BigInt(actuals.length);
          break;
        }
        case "GROWTH_RATE": {
          const rateBps = BigInt(input.growthRateBps ?? 0);
          const lastActual = actuals[actuals.length - 1]!;
          // Compound: last * (1 + rate/10000)^(idx+1) — approximated linearly for BigInt
          forecastAmount = lastActual + (lastActual * rateBps * BigInt(idx + 1)) / 10000n;
          break;
        }
        case "MANUAL":
          forecastAmount = actuals[actuals.length - 1]!;
          break;
      }

      lines.push({
        accountCode,
        forecastPeriodIndex: idx,
        forecastAmount,
        method: input.method,
        isOverride: false,
      });
      totalForecast += forecastAmount;
    }
  }

  return {
    result: {
      lines,
      totalForecast,
      periodsForecasted: input.periodsToForecast,
      accountCount: byAccount.size,
      currencyCode: input.currencyCode,
    },
    inputs: { method: input.method, periodsToForecast: input.periodsToForecast, historicalCount: input.historicalPeriods.length },
    explanation: `Rolling forecast: ${lines.length} lines across ${byAccount.size} accounts for ${input.periodsToForecast} periods`,
  };
}
