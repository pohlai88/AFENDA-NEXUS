/**
 * PA-07: Project profitability calculator.
 * Computes margin, markup, and profitability metrics.
 * Pure calculator — no DB, no side effects.
 */

export interface ProfitabilityInput {
  readonly projectId: string;
  readonly totalRevenue: bigint;
  readonly totalCost: bigint;
  readonly budgetAmount: bigint;
  readonly currencyCode: string;
}

export interface ProfitabilityResult {
  readonly projectId: string;
  readonly totalRevenue: bigint;
  readonly totalCost: bigint;
  readonly grossProfit: bigint;
  /** Margin percentage × 100 (integer, e.g. 25 = 25%) */
  readonly marginPct: number;
  /** Markup percentage × 100 (integer) */
  readonly markupPct: number;
  readonly budgetVariance: bigint;
  readonly budgetUtilizationPct: number;
  readonly currencyCode: string;
}

export function computeProjectProfitability(input: ProfitabilityInput): ProfitabilityResult {
  const grossProfit = input.totalRevenue - input.totalCost;
  const marginPct = input.totalRevenue > 0n ? Number((grossProfit * 100n) / input.totalRevenue) : 0;
  const markupPct = input.totalCost > 0n ? Number((grossProfit * 100n) / input.totalCost) : 0;
  const budgetVariance = input.budgetAmount - input.totalCost;
  const budgetUtilizationPct =
    input.budgetAmount > 0n ? Number((input.totalCost * 100n) / input.budgetAmount) : 0;

  return {
    projectId: input.projectId,
    totalRevenue: input.totalRevenue,
    totalCost: input.totalCost,
    grossProfit,
    marginPct,
    markupPct,
    budgetVariance,
    budgetUtilizationPct,
    currencyCode: input.currencyCode,
  };
}
