import type { Provision } from '../entities/provision.js';

export interface CreateProvisionInput {
  readonly companyId: string;
  readonly provisionNumber: string;
  readonly description: string;
  readonly provisionType: Provision['provisionType'];
  readonly recognitionDate: Date;
  readonly expectedSettlementDate: Date | null;
  readonly initialAmount: bigint;
  readonly currentAmount: bigint;
  readonly discountRateBps: number;
  readonly currencyCode: string;
  readonly glAccountId: string | null;
  readonly isContingentLiability: boolean;
  readonly contingentLiabilityNote: string | null;
  readonly createdBy: string;
}

export interface IProvisionRepo {
  findById(id: string): Promise<Provision | null>;
  findByCompany(companyId: string): Promise<readonly Provision[]>;
  findAll(): Promise<readonly Provision[]>;
  create(tenantId: string, input: CreateProvisionInput): Promise<Provision>;
  updateStatus(id: string, status: Provision['status']): Promise<Provision>;
  updateAmount(id: string, currentAmount: bigint): Promise<Provision>;
}
