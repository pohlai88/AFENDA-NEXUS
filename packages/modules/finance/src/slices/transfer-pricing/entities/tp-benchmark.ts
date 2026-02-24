/**
 * TP-00b: Transfer pricing benchmark entity — OECD Guidelines.
 * Annual comparable data supporting an arm's-length range for a policy.
 */

export type TpBenchmarkMethod = "CUP" | "RESALE_PRICE" | "COST_PLUS" | "TNMM" | "PROFIT_SPLIT";

export interface TpBenchmark {
  readonly id: string;
  readonly tenantId: string;
  readonly policyId: string;
  readonly benchmarkYear: number;
  readonly method: TpBenchmarkMethod;
  readonly comparableCount: number;
  readonly interquartileRangeLowBps: number;
  readonly interquartileRangeMedianBps: number;
  readonly interquartileRangeHighBps: number;
  readonly dataSource: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
