/**
 * PA-04: Percentage-of-completion revenue recognition calculator.
 * Computes revenue to recognize based on cost-to-cost method.
 * Pure calculator — no DB, no side effects.
 */

export interface PctCompletionInput {
  readonly projectId: string;
  readonly contractValue: bigint;
  readonly totalEstimatedCost: bigint;
  readonly actualCostToDate: bigint;
  readonly previouslyRecognizedRevenue: bigint;
  readonly currencyCode: string;
}

export interface PctCompletionResult {
  readonly projectId: string;
  readonly completionPct: number;
  readonly totalRevenueToDate: bigint;
  readonly revenueToRecognize: bigint;
  readonly grossProfitToDate: bigint;
  readonly estimatedTotalProfit: bigint;
  readonly currencyCode: string;
}

export function computePctCompletion(input: PctCompletionInput): PctCompletionResult {
  const completionPct = input.totalEstimatedCost > 0n
    ? Number((input.actualCostToDate * 100n) / input.totalEstimatedCost)
    : 0;

  const totalRevenueToDate = input.totalEstimatedCost > 0n
    ? (input.contractValue * input.actualCostToDate) / input.totalEstimatedCost
    : 0n;

  const revenueToRecognize = totalRevenueToDate - input.previouslyRecognizedRevenue;
  const grossProfitToDate = totalRevenueToDate - input.actualCostToDate;
  const estimatedTotalProfit = input.contractValue - input.totalEstimatedCost;

  return {
    projectId: input.projectId,
    completionPct,
    totalRevenueToDate,
    revenueToRecognize,
    grossProfitToDate,
    estimatedTotalProfit,
    currencyCode: input.currencyCode,
  };
}
