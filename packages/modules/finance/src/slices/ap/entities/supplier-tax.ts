export type SupplierTaxType = 'VAT' | 'GST' | 'SST' | 'TIN' | 'CIT' | 'WHT' | 'CUSTOM';

export interface SupplierTaxRegistration {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly taxType: SupplierTaxType;
  readonly registrationNumber: string;
  readonly issuingCountry: string;
  readonly validFrom: Date | null;
  readonly validUntil: Date | null;
  readonly isVerified: boolean;
  readonly verifiedBy: string | null;
  readonly verifiedAt: Date | null;
  readonly isPrimary: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
