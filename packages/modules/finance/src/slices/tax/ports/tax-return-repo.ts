import type { TaxReturnPeriod } from "../entities/tax-return.js";

export interface CreateTaxReturnInput {
  readonly taxType: string;
  readonly jurisdictionCode: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly outputTax: bigint;
  readonly inputTax: bigint;
  readonly netPayable: bigint;
  readonly currencyCode: string;
}

export interface ITaxReturnRepo {
  findById(id: string): Promise<TaxReturnPeriod | null>;
  findByPeriod(jurisdictionCode: string, periodStart: Date, periodEnd: Date): Promise<TaxReturnPeriod | null>;
  findAll(): Promise<readonly TaxReturnPeriod[]>;
  create(tenantId: string, input: CreateTaxReturnInput): Promise<TaxReturnPeriod>;
  updateStatus(id: string, status: TaxReturnPeriod["status"], filedBy?: string): Promise<TaxReturnPeriod>;
}
