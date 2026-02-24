import { eq, and } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { costCenters } from "@afenda/db";
import type { CostCenter } from "../entities/cost-center.js";
import type { ICostCenterRepo, CreateCostCenterInput } from "../ports/cost-center-repo.js";

type Row = typeof costCenters.$inferSelect;

function mapToDomain(row: Row): CostCenter {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    code: row.code,
    name: row.name,
    parentId: row.parentId,
    level: row.level,
    status: row.status as CostCenter["status"],
    managerId: row.managerId,
    currencyCode: row.currencyCode,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCostCenterRepo implements ICostCenterRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<CostCenter | null> {
    const rows = await this.db.select().from(costCenters).where(eq(costCenters.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCode(companyId: string, code: string): Promise<CostCenter | null> {
    const rows = await this.db.select().from(costCenters)
      .where(and(eq(costCenters.companyId, companyId), eq(costCenters.code, code)))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly CostCenter[]> {
    const rows = await this.db.select().from(costCenters).where(eq(costCenters.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findChildren(parentId: string): Promise<readonly CostCenter[]> {
    const rows = await this.db.select().from(costCenters).where(eq(costCenters.parentId, parentId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly CostCenter[]> {
    const rows = await this.db.select().from(costCenters);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateCostCenterInput): Promise<CostCenter> {
    const [row] = await this.db.insert(costCenters).values({
      tenantId,
      companyId: input.companyId,
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      level: input.level,
      currencyCode: input.currencyCode,
      managerId: input.managerId,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
    }).returning();
    return mapToDomain(row!);
  }

  async update(id: string, input: Partial<Record<string, unknown>>): Promise<CostCenter> {
    const [row] = await this.db.update(costCenters).set(input).where(eq(costCenters.id, id)).returning();
    return mapToDomain(row!);
  }
}
