import type { Result } from '@afenda/core';
import type { SupplierTaxRegistration, SupplierTaxType } from '../entities/supplier-tax.js';

export interface CreateSupplierTaxRegistrationInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly taxType: SupplierTaxType;
  readonly registrationNumber: string;
  readonly issuingCountry: string;
  readonly validFrom: Date | null;
  readonly validUntil: Date | null;
  readonly isPrimary: boolean;
}

export interface ISupplierTaxRepo {
  create(input: CreateSupplierTaxRegistrationInput): Promise<Result<SupplierTaxRegistration>>;
  findBySupplierId(supplierId: string): Promise<readonly SupplierTaxRegistration[]>;
  verify(
    registrationId: string,
    verifiedBy: string
  ): Promise<Result<SupplierTaxRegistration>>;
}
