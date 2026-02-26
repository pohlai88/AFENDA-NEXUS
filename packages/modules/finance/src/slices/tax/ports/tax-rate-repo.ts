import type { TaxRate } from '../entities/tax-rate.js';

export interface CreateTaxRateInput {
  readonly taxCodeId: string;
  readonly name: string;
  readonly ratePercent: number;
  readonly type: TaxRate['type'];
  readonly jurisdictionCode: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
}

export interface ITaxRateRepo {
  findById(id: string): Promise<TaxRate | null>;
  findByTaxCode(taxCodeId: string): Promise<readonly TaxRate[]>;
  findByJurisdiction(jurisdictionCode: string): Promise<readonly TaxRate[]>;
  findActive(asOfDate: Date): Promise<readonly TaxRate[]>;
  findAll(): Promise<readonly TaxRate[]>;
  create(tenantId: string, input: CreateTaxRateInput): Promise<TaxRate>;
  update(id: string, input: Partial<CreateTaxRateInput>): Promise<TaxRate>;
}
