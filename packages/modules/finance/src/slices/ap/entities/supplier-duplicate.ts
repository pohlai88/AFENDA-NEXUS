export type SupplierDuplicateMatchType = 'NAME_MATCH' | 'TAX_ID_MATCH' | 'REG_NO_MATCH' | 'COMBINED';

export type SupplierDuplicateStatus = 'OPEN' | 'CONFIRMED_DUPLICATE' | 'DISMISSED' | 'MERGED';

export interface SupplierDuplicateSuspect {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierAId: string;
  readonly supplierBId: string;
  readonly matchType: SupplierDuplicateMatchType;
  readonly confidence: string;
  readonly status: SupplierDuplicateStatus;
  readonly mergedIntoId: string | null;
  readonly reviewedBy: string | null;
  readonly reviewedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
