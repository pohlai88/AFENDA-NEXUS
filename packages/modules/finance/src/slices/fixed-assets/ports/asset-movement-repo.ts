import type { AssetMovement } from '../entities/asset-movement.js';

export interface CreateAssetMovementInput {
  readonly assetId: string;
  readonly movementType: AssetMovement['movementType'];
  readonly movementDate: Date;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly description: string | null;
  readonly fromCompanyId: string | null;
  readonly toCompanyId: string | null;
  readonly journalId: string | null;
  readonly createdBy: string;
}

export interface IAssetMovementRepo {
  findById(id: string): Promise<AssetMovement | null>;
  findByAsset(assetId: string): Promise<readonly AssetMovement[]>;
  findAll(): Promise<readonly AssetMovement[]>;
  create(tenantId: string, input: CreateAssetMovementInput): Promise<AssetMovement>;
}
