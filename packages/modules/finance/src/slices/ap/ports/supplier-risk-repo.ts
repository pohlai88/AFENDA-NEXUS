import type { Result } from '@afenda/core';
import type {
  SupplierRiskIndicator,
  SupplierRiskRating,
  SupplierRiskCategory,
} from '../entities/supplier-risk.js';

export interface CreateRiskIndicatorInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly riskRating: SupplierRiskRating;
  readonly riskCategory: SupplierRiskCategory;
  readonly description: string;
  readonly incidentDate: Date | null;
  readonly documentId: string | null;
  readonly raisedBy: string;
}

export interface ISupplierRiskRepo {
  create(input: CreateRiskIndicatorInput): Promise<Result<SupplierRiskIndicator>>;
  findBySupplierId(supplierId: string): Promise<readonly SupplierRiskIndicator[]>;
  findActiveBySupplierId(supplierId: string): Promise<readonly SupplierRiskIndicator[]>;
  resolve(indicatorId: string, resolvedBy: string): Promise<Result<SupplierRiskIndicator>>;
}
