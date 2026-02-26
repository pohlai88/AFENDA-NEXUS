/**
 * IA-01: Intangible asset entity — IAS 38.
 * Mirrors fixed-asset structure with intangible-specific fields.
 */

export type IntangibleAssetStatus =
  | 'ACTIVE'
  | 'DISPOSED'
  | 'FULLY_AMORTIZED'
  | 'IMPAIRED'
  | 'IN_DEVELOPMENT';

export type AmortizationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';

export type IntangibleCategory =
  | 'SOFTWARE'
  | 'PATENT'
  | 'TRADEMARK'
  | 'COPYRIGHT'
  | 'LICENCE'
  | 'CUSTOMER_RELATIONSHIP'
  | 'GOODWILL_RELATED'
  | 'DEVELOPMENT_COST'
  | 'OTHER';

export type UsefulLifeType = 'FINITE' | 'INDEFINITE';

export interface IntangibleAsset {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly assetNumber: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: IntangibleCategory;
  readonly usefulLifeType: UsefulLifeType;
  readonly acquisitionDate: Date;
  readonly acquisitionCost: bigint;
  readonly residualValue: bigint;
  readonly usefulLifeMonths: number | null;
  readonly amortizationMethod: AmortizationMethod | null;
  readonly accumulatedAmortization: bigint;
  readonly netBookValue: bigint;
  readonly currencyCode: string;
  readonly glAccountId: string;
  readonly amortizationAccountId: string;
  readonly accumulatedAmortizationAccountId: string;
  readonly status: IntangibleAssetStatus;
  readonly isInternallyGenerated: boolean;
  readonly developmentPhase: 'RESEARCH' | 'DEVELOPMENT' | 'COMPLETED' | null;
  readonly disposedAt: Date | null;
  readonly disposalProceeds: bigint | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
