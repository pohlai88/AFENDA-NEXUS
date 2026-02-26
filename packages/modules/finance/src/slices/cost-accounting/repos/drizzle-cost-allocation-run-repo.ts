import { eq, and } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { costAllocationRuns, costAllocationLines } from '@afenda/db';
import type { CostAllocationRun, CostAllocationLine } from '../entities/cost-allocation-run.js';
import type {
  ICostAllocationRunRepo,
  CreateAllocationRunInput,
  CreateAllocationLineInput,
} from '../ports/cost-allocation-run-repo.js';

type RunRow = typeof costAllocationRuns.$inferSelect;
type LineRow = typeof costAllocationLines.$inferSelect;

function mapRunToDomain(row: RunRow): CostAllocationRun {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    periodId: row.periodId,
    method: row.method as CostAllocationRun['method'],
    status: row.status as CostAllocationRun['status'],
    totalAllocated: row.totalAllocated,
    currencyCode: row.currencyCode,
    lineCount: row.lineCount,
    executedBy: row.executedBy,
    executedAt: row.executedAt,
    reversedAt: row.reversedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapLineToDomain(row: LineRow): CostAllocationLine {
  return {
    id: row.id,
    runId: row.runId,
    fromCostCenterId: row.fromCostCenterId,
    toCostCenterId: row.toCostCenterId,
    driverId: row.driverId,
    amount: row.amount,
    driverQuantity: row.driverQuantity,
    allocationRate: row.allocationRate,
  };
}

export class DrizzleCostAllocationRunRepo implements ICostAllocationRunRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<CostAllocationRun | null> {
    const rows = await this.db
      .select()
      .from(costAllocationRuns)
      .where(eq(costAllocationRuns.id, id))
      .limit(1);
    return rows[0] ? mapRunToDomain(rows[0]) : null;
  }

  async findByPeriod(companyId: string, periodId: string): Promise<readonly CostAllocationRun[]> {
    const rows = await this.db
      .select()
      .from(costAllocationRuns)
      .where(
        and(eq(costAllocationRuns.companyId, companyId), eq(costAllocationRuns.periodId, periodId))
      );
    return rows.map(mapRunToDomain);
  }

  async findAll(): Promise<readonly CostAllocationRun[]> {
    const rows = await this.db.select().from(costAllocationRuns);
    return rows.map(mapRunToDomain);
  }

  async create(tenantId: string, input: CreateAllocationRunInput): Promise<CostAllocationRun> {
    const [row] = await this.db
      .insert(costAllocationRuns)
      .values({
        tenantId,
        companyId: input.companyId,
        periodId: input.periodId,
        method: input.method,
        currencyCode: input.currencyCode,
        executedBy: input.executedBy,
      })
      .returning();
    return mapRunToDomain(row!);
  }

  async updateStatus(
    id: string,
    status: CostAllocationRun['status'],
    totalAllocated: bigint,
    lineCount: number
  ): Promise<CostAllocationRun> {
    const updates: Record<string, unknown> = { status, totalAllocated, lineCount };
    if (status === 'COMPLETED') updates.executedAt = new Date();
    if (status === 'REVERSED') updates.reversedAt = new Date();
    const [row] = await this.db
      .update(costAllocationRuns)
      .set(updates)
      .where(eq(costAllocationRuns.id, id))
      .returning();
    return mapRunToDomain(row!);
  }

  async createLines(
    tenantId: string,
    lines: readonly CreateAllocationLineInput[]
  ): Promise<readonly CostAllocationLine[]> {
    if (lines.length === 0) return [];
    const rows = await this.db
      .insert(costAllocationLines)
      .values(
        lines.map((l) => ({
          tenantId,
          runId: l.runId,
          fromCostCenterId: l.fromCostCenterId,
          toCostCenterId: l.toCostCenterId,
          driverId: l.driverId,
          amount: l.amount,
          driverQuantity: l.driverQuantity,
          allocationRate: l.allocationRate,
        }))
      )
      .returning();
    return rows.map(mapLineToDomain);
  }

  async findLinesByRun(runId: string): Promise<readonly CostAllocationLine[]> {
    const rows = await this.db
      .select()
      .from(costAllocationLines)
      .where(eq(costAllocationLines.runId, runId));
    return rows.map(mapLineToDomain);
  }
}
