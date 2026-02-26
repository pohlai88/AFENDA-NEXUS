import type { HedgeRelationship, HedgeStatus } from '../entities/hedge-relationship.js';

export interface CreateHedgeRelationshipInput {
  readonly companyId: string;
  readonly hedgeType: HedgeRelationship['hedgeType'];
  readonly hedgingInstrumentId: string;
  readonly hedgedItemId: string;
  readonly hedgedRisk: string;
  readonly hedgeRatio: number;
  readonly designationDate: Date;
  readonly ociReserveBalance: bigint;
  readonly currencyCode: string;
}

export interface IHedgeRelationshipRepo {
  findById(id: string): Promise<HedgeRelationship | null>;
  findAll(): Promise<readonly HedgeRelationship[]>;
  findByCompany(companyId: string): Promise<readonly HedgeRelationship[]>;
  create(tenantId: string, input: CreateHedgeRelationshipInput): Promise<HedgeRelationship>;
  updateStatus(id: string, status: HedgeStatus, reason?: string): Promise<HedgeRelationship>;
}
