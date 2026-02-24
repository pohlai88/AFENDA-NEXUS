import type { TpBenchmark } from "../entities/tp-benchmark.js";

export interface CreateTpBenchmarkInput {
  readonly policyId: string;
  readonly benchmarkYear: number;
  readonly method: TpBenchmark["method"];
  readonly comparableCount: number;
  readonly interquartileRangeLowBps: number;
  readonly interquartileRangeMedianBps: number;
  readonly interquartileRangeHighBps: number;
  readonly dataSource: string | null;
  readonly notes: string | null;
}

export interface ITpBenchmarkRepo {
  findByPolicy(policyId: string): Promise<readonly TpBenchmark[]>;
  findLatest(policyId: string): Promise<TpBenchmark | null>;
  create(tenantId: string, input: CreateTpBenchmarkInput): Promise<TpBenchmark>;
}
