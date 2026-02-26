import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { assets } from '@afenda/db';
import type { Asset } from '../entities/asset.js';
import type { IAssetRepo, CreateAssetInput } from '../ports/asset-repo.js';

type Row = typeof assets.$inferSelect;

function mapToDomain(row: Row): Asset {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    assetNumber: row.assetNumber,
    name: row.name,
    description: row.description,
    categoryCode: row.categoryCode,
    acquisitionDate: row.acquisitionDate,
    acquisitionCost: row.acquisitionCost,
    residualValue: row.residualValue,
    usefulLifeMonths: row.usefulLifeMonths,
    depreciationMethod: row.depreciationMethod as Asset['depreciationMethod'],
    accumulatedDepreciation: row.accumulatedDepreciation,
    netBookValue: row.netBookValue,
    currencyCode: row.currencyCode,
    locationCode: row.locationCode,
    costCenterId: row.costCenterId,
    glAccountId: row.glAccountId,
    depreciationAccountId: row.depreciationAccountId,
    accumulatedDepreciationAccountId: row.accumulatedDepreciationAccountId,
    status: row.status as Asset['status'],
    disposedAt: row.disposedAt,
    disposalProceeds: row.disposalProceeds,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleAssetRepo implements IAssetRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<Asset | null> {
    const rows = await this.db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByNumber(assetNumber: string): Promise<Asset | null> {
    const rows = await this.db
      .select()
      .from(assets)
      .where(eq(assets.assetNumber, assetNumber))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly Asset[]> {
    const rows = await this.db.select().from(assets).where(eq(assets.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findActive(): Promise<readonly Asset[]> {
    const rows = await this.db.select().from(assets).where(eq(assets.status, 'ACTIVE'));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly Asset[]> {
    const rows = await this.db.select().from(assets);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateAssetInput): Promise<Asset> {
    const [row] = await this.db
      .insert(assets)
      .values({
        tenantId,
        companyId: input.companyId,
        assetNumber: input.assetNumber,
        name: input.name,
        description: input.description,
        categoryCode: input.categoryCode,
        acquisitionDate: input.acquisitionDate,
        acquisitionCost: input.acquisitionCost,
        residualValue: input.residualValue,
        usefulLifeMonths: input.usefulLifeMonths,
        depreciationMethod: input.depreciationMethod,
        currencyCode: input.currencyCode,
        locationCode: input.locationCode,
        costCenterId: input.costCenterId,
        glAccountId: input.glAccountId,
        depreciationAccountId: input.depreciationAccountId,
        accumulatedDepreciationAccountId: input.accumulatedDepreciationAccountId,
        netBookValue: input.acquisitionCost - input.residualValue,
        status: input.status,
      })
      .returning();
    return mapToDomain(row!);
  }

  async update(
    id: string,
    input: Partial<
      CreateAssetInput & {
        accumulatedDepreciation: bigint;
        netBookValue: bigint;
        disposedAt: Date;
        disposalProceeds: bigint;
      }
    >
  ): Promise<Asset> {
    const [row] = await this.db.update(assets).set(input).where(eq(assets.id, id)).returning();
    return mapToDomain(row!);
  }
}
