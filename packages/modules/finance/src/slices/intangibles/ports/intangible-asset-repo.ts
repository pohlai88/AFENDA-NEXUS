import type { IntangibleAsset, IntangibleAssetStatus } from '../entities/intangible-asset.js';

export interface CreateIntangibleAssetInput {
  readonly companyId: string;
  readonly assetNumber: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: IntangibleAsset['category'];
  readonly usefulLifeType: IntangibleAsset['usefulLifeType'];
  readonly acquisitionDate: Date;
  readonly acquisitionCost: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number | null;
  readonly netBookValue: bigint;
  readonly currencyCode: string;
  readonly glAccountId: string;
  readonly amortizationAccountId: string;
  readonly accumulatedAmortizationAccountId: string;
  readonly isInternallyGenerated: boolean;
}

export interface IIntangibleAssetRepo {
  findById(id: string): Promise<IntangibleAsset | null>;
  findAll(): Promise<readonly IntangibleAsset[]>;
  findByCompany(companyId: string): Promise<readonly IntangibleAsset[]>;
  create(tenantId: string, input: CreateIntangibleAssetInput): Promise<IntangibleAsset>;
  updateStatus(id: string, status: IntangibleAssetStatus): Promise<IntangibleAsset>;
  updateAmortization(
    id: string,
    accumulatedAmortization: bigint,
    netBookValue: bigint
  ): Promise<IntangibleAsset>;
}
