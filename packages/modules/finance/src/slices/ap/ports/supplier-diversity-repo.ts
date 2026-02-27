import type { Result } from '@afenda/core';
import type { SupplierDiversity, SupplierDiversityCode } from '../entities/supplier-diversity.js';

export interface CreateSupplierDiversityInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly diversityCode: SupplierDiversityCode;
  readonly certificateNumber: string | null;
  readonly validFrom: Date | null;
  readonly validUntil: Date | null;
  readonly documentId: string | null;
}

export interface ISupplierDiversityRepo {
  create(input: CreateSupplierDiversityInput): Promise<Result<SupplierDiversity>>;
  findBySupplierId(supplierId: string): Promise<readonly SupplierDiversity[]>;
}
