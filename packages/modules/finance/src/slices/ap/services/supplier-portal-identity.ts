import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { Supplier } from '../entities/supplier.js';

export interface SupplierIdentityInput {
  readonly tenantId: string;
  readonly userId: string;
}

export interface SupplierIdentityResult {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly supplierCode: string;
  readonly currencyCode: string;
  readonly status: string;
  readonly taxId: string | null;
  readonly remittanceEmail: string | null;
}

/**
 * Resolves the authenticated user's linked supplier profile.
 * Used by GET /portal/me to return the supplier identity
 * for the current session without requiring a supplierId param.
 */
export async function resolveSupplierIdentity(
  input: SupplierIdentityInput,
  deps: { supplierRepo: ISupplierRepo }
): Promise<Result<SupplierIdentityResult>> {
  const result = await deps.supplierRepo.findByUserId(input.userId);

  if (!result.ok) {
    return err(
      new AppError(
        'NOT_FOUND',
        'No supplier profile is linked to your account. Contact your administrator.'
      )
    );
  }

  const supplier: Supplier = result.value;

  if (supplier.status === 'INACTIVE') {
    return err(
      new AppError(
        'INVALID_STATE',
        'Your supplier account is inactive. Contact your administrator.'
      )
    );
  }

  return ok({
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierCode: supplier.code,
    currencyCode: supplier.currencyCode,
    status: supplier.status,
    taxId: supplier.taxId,
    remittanceEmail: supplier.remittanceEmail,
  });
}
