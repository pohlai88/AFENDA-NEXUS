import type { Result } from '@afenda/core';
import type {
  SupplierDuplicateSuspect,
  SupplierDuplicateMatchType,
} from '../entities/supplier-duplicate.js';

export interface CreateDuplicateSuspectInput {
  readonly tenantId: string;
  readonly supplierAId: string;
  readonly supplierBId: string;
  readonly matchType: SupplierDuplicateMatchType;
  readonly confidence: string;
}

export interface ISupplierDuplicateRepo {
  create(input: CreateDuplicateSuspectInput): Promise<Result<SupplierDuplicateSuspect>>;
  findOpen(tenantId: string): Promise<readonly SupplierDuplicateSuspect[]>;
  dismiss(suspectId: string, reviewedBy: string): Promise<Result<SupplierDuplicateSuspect>>;
  markMerged(
    suspectId: string,
    mergedIntoId: string,
    reviewedBy: string
  ): Promise<Result<SupplierDuplicateSuspect>>;
}
