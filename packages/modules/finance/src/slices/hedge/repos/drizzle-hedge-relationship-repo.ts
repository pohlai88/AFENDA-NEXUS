import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { hedgeRelationships } from "@afenda/db";
import type { HedgeRelationship, HedgeStatus } from "../entities/hedge-relationship.js";
import type { IHedgeRelationshipRepo, CreateHedgeRelationshipInput } from "../ports/hedge-relationship-repo.js";

type Row = typeof hedgeRelationships.$inferSelect;

function mapToDomain(row: Row): HedgeRelationship {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    hedgeType: row.hedgeType as HedgeRelationship["hedgeType"],
    hedgingInstrumentId: row.hedgingInstrumentId,
    hedgedItemId: row.hedgedItemId,
    hedgedRisk: row.hedgedRisk,
    hedgeRatio: row.hedgeRatio,
    designationDate: row.designationDate,
    status: row.status as HedgeRelationship["status"],
    discontinuationDate: row.discontinuationDate,
    discontinuationReason: row.discontinuationReason,
    ociReserveBalance: row.ociReserveBalance,
    currencyCode: row.currencyCode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleHedgeRelationshipRepo implements IHedgeRelationshipRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<HedgeRelationship | null> {
    const rows = await this.db.select().from(hedgeRelationships).where(eq(hedgeRelationships.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly HedgeRelationship[]> {
    const rows = await this.db.select().from(hedgeRelationships);
    return rows.map(mapToDomain);
  }

  async findByCompany(companyId: string): Promise<readonly HedgeRelationship[]> {
    const rows = await this.db
      .select()
      .from(hedgeRelationships)
      .where(eq(hedgeRelationships.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateHedgeRelationshipInput): Promise<HedgeRelationship> {
    const [row] = await this.db.insert(hedgeRelationships).values({ tenantId, ...input }).returning();
    return mapToDomain(row!);
  }

  async updateStatus(id: string, status: HedgeStatus, reason?: string): Promise<HedgeRelationship> {
    const setValues: Record<string, unknown> = { status };
    if (status === "DISCONTINUED") {
      setValues.discontinuationDate = new Date();
      if (reason) setValues.discontinuationReason = reason;
    }
    const [row] = await this.db
      .update(hedgeRelationships)
      .set(setValues)
      .where(eq(hedgeRelationships.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
