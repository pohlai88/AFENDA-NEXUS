import type { TaxCode } from "../entities/tax-code.js";

export interface CreateTaxCodeInput {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly jurisdictionLevel: TaxCode["jurisdictionLevel"];
  readonly countryCode: string;
  readonly stateCode: string | null;
  readonly cityCode: string | null;
  readonly parentId: string | null;
  readonly isCompound: boolean;
}

export interface ITaxCodeRepo {
  findById(id: string): Promise<TaxCode | null>;
  findByCode(code: string): Promise<TaxCode | null>;
  findByCountry(countryCode: string): Promise<readonly TaxCode[]>;
  findAll(): Promise<readonly TaxCode[]>;
  create(tenantId: string, input: CreateTaxCodeInput): Promise<TaxCode>;
  update(id: string, input: Partial<CreateTaxCodeInput>): Promise<TaxCode>;
}
