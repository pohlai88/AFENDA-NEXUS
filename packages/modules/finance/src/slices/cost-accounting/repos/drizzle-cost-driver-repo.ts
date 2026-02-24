import { eq, and } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { costDrivers, costDriverValues } from "@afenda/db";
import type { CostDriver, CostDriverValue } from "../entities/cost-driver.js";
import type { ICostDriverRepo, CreateCostDriverInput, UpsertDriverValueInput } from "../ports/cost-driver-repo.js";

type DriverRow = typeof costDrivers.$inferSelect;
type ValueRow = typeof costDriverValues.$inferSelect;

function mapDriverToDomain(row: DriverRow): CostDriver {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    code: row.code,
    name: row.name,
    driverType: row.driverType as CostDriver["driverType"],
    unitOfMeasure: row.unitOfMeasure,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapValueToDomain(row: ValueRow): CostDriverValue {
  return {
    driverId: row.driverId,
    costCenterId: row.costCenterId,
    periodId: row.periodId,
    quantity: row.quantity,
  };
}

export class DrizzleCostDriverRepo implements ICostDriverRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<CostDriver | null> {
    const rows = await this.db.select().from(costDrivers).where(eq(costDrivers.id, id)).limit(1);
    return rows[0] ? mapDriverToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly CostDriver[]> {
    const rows = await this.db.select().from(costDrivers).where(eq(costDrivers.companyId, companyId));
    return rows.map(mapDriverToDomain);
  }

  async findAll(): Promise<readonly CostDriver[]> {
    const rows = await this.db.select().from(costDrivers);
    return rows.map(mapDriverToDomain);
  }

  async create(tenantId: string, input: CreateCostDriverInput): Promise<CostDriver> {
    const [row] = await this.db.insert(costDrivers).values({
      tenantId,
      companyId: input.companyId,
      code: input.code,
      name: input.name,
      driverType: input.driverType,
      unitOfMeasure: input.unitOfMeasure,
    }).returning();
    return mapDriverToDomain(row!);
  }

  async update(id: string, input: Partial<Record<string, unknown>>): Promise<CostDriver> {
    const [row] = await this.db.update(costDrivers).set(input).where(eq(costDrivers.id, id)).returning();
    return mapDriverToDomain(row!);
  }

  async getDriverValues(driverId: string, periodId: string): Promise<readonly CostDriverValue[]> {
    const rows = await this.db.select().from(costDriverValues)
      .where(and(eq(costDriverValues.driverId, driverId), eq(costDriverValues.periodId, periodId)));
    return rows.map(mapValueToDomain);
  }

  async upsertDriverValue(tenantId: string, input: UpsertDriverValueInput): Promise<CostDriverValue> {
    const [row] = await this.db.insert(costDriverValues).values({
      tenantId,
      driverId: input.driverId,
      costCenterId: input.costCenterId,
      periodId: input.periodId,
      quantity: input.quantity,
    }).onConflictDoUpdate({
      target: [costDriverValues.tenantId, costDriverValues.driverId, costDriverValues.costCenterId, costDriverValues.periodId],
      set: { quantity: input.quantity },
    }).returning();
    return mapValueToDomain(row!);
  }
}
