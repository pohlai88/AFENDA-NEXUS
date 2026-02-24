import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { intangibleAssets } from "@afenda/db";
import type { IntangibleAsset, IntangibleAssetStatus } from "../entities/intangible-asset.js";
import type { IIntangibleAssetRepo, CreateIntangibleAssetInput } from "../ports/intangible-asset-repo.js";

type Row = typeof intangibleAssets.$inferSelect;

function mapToDomain(row: Row): IntangibleAsset {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    assetNumber: row.assetNumber,
    name: row.name,
    description: row.description,
    category: row.category as IntangibleAsset["category"],
    usefulLifeType: row.usefulLifeType as IntangibleAsset["usefulLifeType"],
    acquisitionDate: row.acquisitionDate,
    acquisitionCost: row.acquisitionCost,
    residualValue: row.residualValue,
    usefulLifeMonths: row.usefulLifeMonths,
    amortizationMethod: null, // TODO: add column to DB schema
    accumulatedAmortization: row.accumulatedAmortization,
    netBookValue: row.netBookValue,
    currencyCode: row.currencyCode,
    glAccountId: row.glAccountId,
    amortizationAccountId: row.amortizationAccountId,
    accumulatedAmortizationAccountId: row.accumulatedAmortizationAccountId,
    status: row.status as IntangibleAsset["status"],
    isInternallyGenerated: row.isInternallyGenerated,
    developmentPhase: null, // TODO: add column to DB schema
    disposedAt: null, // TODO: add column to DB schema
    disposalProceeds: null, // TODO: add column to DB schema
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleIntangibleAssetRepo implements IIntangibleAssetRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<IntangibleAsset | null> {
    const rows = await this.db.select().from(intangibleAssets).where(eq(intangibleAssets.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly IntangibleAsset[]> {
    const rows = await this.db.select().from(intangibleAssets);
    return rows.map(mapToDomain);
  }

  async findByCompany(companyId: string): Promise<readonly IntangibleAsset[]> {
    const rows = await this.db
      .select()
      .from(intangibleAssets)
      .where(eq(intangibleAssets.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateIntangibleAssetInput): Promise<IntangibleAsset> {
    const [row] = await this.db.insert(intangibleAssets).values({ tenantId, ...input }).returning();
    return mapToDomain(row!);
  }

  async updateStatus(id: string, status: IntangibleAssetStatus): Promise<IntangibleAsset> {
    const [row] = await this.db
      .update(intangibleAssets)
      .set({ status })
      .where(eq(intangibleAssets.id, id))
      .returning();
    return mapToDomain(row!);
  }

  async updateAmortization(id: string, accumulatedAmortization: bigint, netBookValue: bigint): Promise<IntangibleAsset> {
    const [row] = await this.db
      .update(intangibleAssets)
      .set({ accumulatedAmortization, netBookValue })
      .where(eq(intangibleAssets.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
