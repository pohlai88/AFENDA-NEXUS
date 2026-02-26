import { eq, desc } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { tpBenchmarks } from '@afenda/db';
import type { TpBenchmark } from '../entities/tp-benchmark.js';
import type { ITpBenchmarkRepo, CreateTpBenchmarkInput } from '../ports/tp-benchmark-repo.js';

type Row = typeof tpBenchmarks.$inferSelect;

function mapToDomain(row: Row): TpBenchmark {
  return {
    id: row.id,
    tenantId: row.tenantId,
    policyId: row.policyId,
    benchmarkYear: row.benchmarkYear,
    method: row.method as TpBenchmark['method'],
    comparableCount: row.comparableCount,
    interquartileRangeLowBps: row.interquartileRangeLowBps,
    interquartileRangeMedianBps: row.interquartileRangeMedianBps,
    interquartileRangeHighBps: row.interquartileRangeHighBps,
    dataSource: row.dataSource,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTpBenchmarkRepo implements ITpBenchmarkRepo {
  constructor(private readonly db: TenantTx) {}

  async findByPolicy(policyId: string): Promise<readonly TpBenchmark[]> {
    const rows = await this.db
      .select()
      .from(tpBenchmarks)
      .where(eq(tpBenchmarks.policyId, policyId))
      .orderBy(desc(tpBenchmarks.benchmarkYear));
    return rows.map(mapToDomain);
  }

  async findLatest(policyId: string): Promise<TpBenchmark | null> {
    const rows = await this.db
      .select()
      .from(tpBenchmarks)
      .where(eq(tpBenchmarks.policyId, policyId))
      .orderBy(desc(tpBenchmarks.benchmarkYear))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async create(tenantId: string, input: CreateTpBenchmarkInput): Promise<TpBenchmark> {
    const [row] = await this.db
      .insert(tpBenchmarks)
      .values({ tenantId, ...input })
      .returning();
    return mapToDomain(row!);
  }
}
