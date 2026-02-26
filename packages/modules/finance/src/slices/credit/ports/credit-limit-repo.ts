import type { CreditLimit } from '../entities/credit-limit.js';

export interface CreateCreditLimitInput {
  readonly customerId: string;
  readonly companyId: string;
  readonly creditLimit: bigint;
  readonly currencyCode: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly riskRating: string | null;
  readonly approvedBy: string | null;
}

export interface ICreditLimitRepo {
  findById(id: string): Promise<CreditLimit | null>;
  findByCustomer(customerId: string): Promise<CreditLimit | null>;
  findByCompany(companyId: string): Promise<readonly CreditLimit[]>;
  findAll(): Promise<readonly CreditLimit[]>;
  create(tenantId: string, input: CreateCreditLimitInput): Promise<CreditLimit>;
  update(
    id: string,
    input: Partial<
      CreateCreditLimitInput & {
        currentExposure: bigint;
        availableCredit: bigint;
        status: CreditLimit['status'];
        lastReviewDate: Date;
        nextReviewDate: Date;
      }
    >
  ): Promise<CreditLimit>;
}
