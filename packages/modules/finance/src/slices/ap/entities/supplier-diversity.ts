export type SupplierDiversityCode =
  | 'SMALL_BUSINESS'
  | 'MINORITY_OWNED'
  | 'WOMEN_OWNED'
  | 'VETERAN_OWNED'
  | 'DISABLED_OWNED'
  | 'INDIGENOUS_OWNED'
  | 'LARGE_ENTERPRISE'
  | 'NONE';

export interface SupplierDiversity {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly diversityCode: SupplierDiversityCode;
  readonly certificateNumber: string | null;
  readonly validFrom: Date | null;
  readonly validUntil: Date | null;
  readonly documentId: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
