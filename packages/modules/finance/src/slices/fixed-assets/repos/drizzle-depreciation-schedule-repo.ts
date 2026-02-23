import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { depreciationSchedules } from "@afenda/db";
import type { DepreciationScheduleEntry } from "../entities/depreciation-schedule.js";
import type { IDepreciationScheduleRepo, CreateDepreciationEntryInput } from "../ports/depreciation-schedule-repo.js";

type Row = typeof depreciationSchedules.$inferSelect;

function mapToDomain(row: Row): DepreciationScheduleEntry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assetId: row.assetId,
    componentId: row.componentId,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    depreciationAmount: row.depreciationAmount,
    accumulatedDepreciation: row.accumulatedDepreciation,
    netBookValue: row.netBookValue,
    currencyCode: row.currencyCode,
    journalId: row.journalId,
    isPosted: row.isPosted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleDepreciationScheduleRepo implements IDepreciationScheduleRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<DepreciationScheduleEntry | null> {
    const rows = await this.db.select().from(depreciationSchedules).where(eq(depreciationSchedules.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByAsset(assetId: string): Promise<readonly DepreciationScheduleEntry[]> {
    const rows = await this.db.select().from(depreciationSchedules).where(eq(depreciationSchedules.assetId, assetId));
    return rows.map(mapToDomain);
  }

  async findUnposted(): Promise<readonly DepreciationScheduleEntry[]> {
    const rows = await this.db.select().from(depreciationSchedules).where(eq(depreciationSchedules.isPosted, false));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateDepreciationEntryInput): Promise<DepreciationScheduleEntry> {
    const [row] = await this.db.insert(depreciationSchedules).values({
      tenantId,
      assetId: input.assetId,
      componentId: input.componentId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      depreciationAmount: input.depreciationAmount,
      accumulatedDepreciation: input.accumulatedDepreciation,
      netBookValue: input.netBookValue,
      currencyCode: input.currencyCode,
      journalId: input.journalId,
    }).returning();
    return mapToDomain(row!);
  }

  async markPosted(id: string, journalId: string): Promise<DepreciationScheduleEntry> {
    const [row] = await this.db.update(depreciationSchedules).set({ isPosted: true, journalId }).where(eq(depreciationSchedules.id, id)).returning();
    return mapToDomain(row!);
  }
}
