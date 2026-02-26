import type { Asset } from '../entities/asset.js';

export interface CreateAssetInput {
  readonly companyId: string;
  readonly assetNumber: string;
  readonly name: string;
  readonly description: string | null;
  readonly categoryCode: string;
  readonly acquisitionDate: Date;
  readonly acquisitionCost: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number;
  readonly depreciationMethod: Asset['depreciationMethod'];
  readonly currencyCode: string;
  readonly locationCode: string | null;
  readonly costCenterId: string | null;
  readonly glAccountId: string;
  readonly depreciationAccountId: string;
  readonly accumulatedDepreciationAccountId: string;
  readonly status: Asset['status'];
}

export interface IAssetRepo {
  findById(id: string): Promise<Asset | null>;
  findByNumber(assetNumber: string): Promise<Asset | null>;
  findByCompany(companyId: string): Promise<readonly Asset[]>;
  findActive(): Promise<readonly Asset[]>;
  findAll(): Promise<readonly Asset[]>;
  create(tenantId: string, input: CreateAssetInput): Promise<Asset>;
  update(
    id: string,
    input: Partial<
      CreateAssetInput & {
        accumulatedDepreciation: bigint;
        netBookValue: bigint;
        disposedAt: Date;
        disposalProceeds: bigint;
      }
    >
  ): Promise<Asset>;
}
