import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { assetMovements } from '@afenda/db';
import type { AssetMovement } from '../entities/asset-movement.js';
import type { IAssetMovementRepo, CreateAssetMovementInput } from '../ports/asset-movement-repo.js';

type Row = typeof assetMovements.$inferSelect;

function mapToDomain(row: Row): AssetMovement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    assetId: row.assetId,
    movementType: row.movementType as AssetMovement['movementType'],
    movementDate: row.movementDate,
    amount: row.amount,
    currencyCode: row.currencyCode,
    description: row.description,
    fromCompanyId: row.fromCompanyId,
    toCompanyId: row.toCompanyId,
    journalId: row.journalId,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleAssetMovementRepo implements IAssetMovementRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<AssetMovement | null> {
    const rows = await this.db
      .select()
      .from(assetMovements)
      .where(eq(assetMovements.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByAsset(assetId: string): Promise<readonly AssetMovement[]> {
    const rows = await this.db
      .select()
      .from(assetMovements)
      .where(eq(assetMovements.assetId, assetId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly AssetMovement[]> {
    const rows = await this.db.select().from(assetMovements);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateAssetMovementInput): Promise<AssetMovement> {
    const [row] = await this.db
      .insert(assetMovements)
      .values({
        tenantId,
        assetId: input.assetId,
        movementType: input.movementType,
        movementDate: input.movementDate,
        amount: input.amount,
        currencyCode: input.currencyCode,
        description: input.description,
        fromCompanyId: input.fromCompanyId,
        toCompanyId: input.toCompanyId,
        journalId: input.journalId,
        createdBy: input.createdBy,
      })
      .returning();
    return mapToDomain(row!);
  }
}
