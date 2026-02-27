export type SupplierRiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SupplierRiskCategory =
  | 'FINANCIAL'
  | 'QUALITY'
  | 'COMPLIANCE'
  | 'FRAUD'
  | 'DELIVERY'
  | 'OTHER';

export interface SupplierRiskIndicator {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly riskRating: SupplierRiskRating;
  readonly riskCategory: SupplierRiskCategory;
  readonly description: string;
  readonly incidentDate: Date | null;
  readonly documentId: string | null;
  readonly raisedBy: string;
  readonly resolvedAt: Date | null;
  readonly resolvedBy: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
