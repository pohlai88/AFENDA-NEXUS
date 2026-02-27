import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { ISupplierBlockRepo } from '../ports/supplier-block-repo.js';

export interface SupplierGuardDeps {
  readonly supplierRepo: ISupplierRepo;
  readonly supplierBlockRepo?: ISupplierBlockRepo;
}

export async function checkSupplierProcurementEligibility(
  supplierId: string,
  companyId: string | undefined,
  deps: SupplierGuardDeps
): Promise<Result<void>> {
  const supplierResult = await deps.supplierRepo.findById(supplierId);
  if (!supplierResult.ok) return err(new AppError('NOT_FOUND', 'Supplier not found'));

  const supplier = supplierResult.value;

  if (supplier.status === 'BLACKLISTED') {
    return err(new AppError('INVALID_STATE', 'Supplier is blacklisted and cannot be used'));
  }

  if (supplier.status === 'BLOCKED') {
    return err(new AppError('INVALID_STATE', 'Supplier is blocked'));
  }

  if (supplier.onboardingStatus !== 'ACTIVE') {
    return err(
      new AppError('INVALID_STATE', `Supplier onboarding status is ${supplier.onboardingStatus}`)
    );
  }

  if (deps.supplierBlockRepo) {
    const blocks = await deps.supplierBlockRepo.findActiveBlocksByType(
      supplierId,
      'PURCHASING_BLOCK',
      companyId
    );
    const fullBlocks = await deps.supplierBlockRepo.findActiveBlocksByType(
      supplierId,
      'FULL_BLOCK',
      companyId
    );
    if (blocks.length > 0 || fullBlocks.length > 0) {
      return err(new AppError('INVALID_STATE', 'Supplier has an active purchasing block'));
    }
  }

  return ok(undefined);
}

export async function checkSupplierInvoiceEligibility(
  supplierId: string,
  companyId: string | undefined,
  deps: SupplierGuardDeps
): Promise<Result<void>> {
  const supplierResult = await deps.supplierRepo.findById(supplierId);
  if (!supplierResult.ok) return err(new AppError('NOT_FOUND', 'Supplier not found'));

  const supplier = supplierResult.value;

  if (supplier.status === 'BLACKLISTED') {
    return err(new AppError('INVALID_STATE', 'Supplier is blacklisted and cannot be used'));
  }

  if (supplier.status === 'BLOCKED') {
    return err(new AppError('INVALID_STATE', 'Supplier is blocked'));
  }

  if (supplier.onboardingStatus !== 'ACTIVE') {
    return err(
      new AppError('INVALID_STATE', `Supplier onboarding status is ${supplier.onboardingStatus}`)
    );
  }

  if (deps.supplierBlockRepo) {
    const blocks = await deps.supplierBlockRepo.findActiveBlocksByType(
      supplierId,
      'POSTING_BLOCK',
      companyId
    );
    const fullBlocks = await deps.supplierBlockRepo.findActiveBlocksByType(
      supplierId,
      'FULL_BLOCK',
      companyId
    );
    if (blocks.length > 0 || fullBlocks.length > 0) {
      return err(new AppError('INVALID_STATE', 'Supplier has an active posting block'));
    }
  }

  return ok(undefined);
}

export async function checkSupplierPaymentEligibility(
  supplierId: string,
  companyId: string | undefined,
  deps: SupplierGuardDeps
): Promise<Result<void>> {
  const supplierResult = await deps.supplierRepo.findById(supplierId);
  if (!supplierResult.ok) return err(new AppError('NOT_FOUND', 'Supplier not found'));

  const supplier = supplierResult.value;

  if (supplier.status === 'BLACKLISTED') {
    return err(new AppError('INVALID_STATE', 'Supplier is blacklisted'));
  }

  if (deps.supplierBlockRepo) {
    const blocks = await deps.supplierBlockRepo.findActiveBlocksByType(
      supplierId,
      'PAYMENT_BLOCK',
      companyId
    );
    const fullBlocks = await deps.supplierBlockRepo.findActiveBlocksByType(
      supplierId,
      'FULL_BLOCK',
      companyId
    );
    if (blocks.length > 0 || fullBlocks.length > 0) {
      return err(new AppError('INVALID_STATE', 'Supplier has an active payment block'));
    }
  }

  return ok(undefined);
}

export async function checkSupplierPortalEligibility(
  supplierId: string,
  deps: SupplierGuardDeps
): Promise<Result<void>> {
  const supplierResult = await deps.supplierRepo.findById(supplierId);
  if (!supplierResult.ok) return err(new AppError('NOT_FOUND', 'Supplier not found'));

  const supplier = supplierResult.value;

  if (supplier.status === 'BLACKLISTED') {
    return err(new AppError('INVALID_STATE', 'Access denied'));
  }

  if (supplier.status === 'BLOCKED') {
    return err(
      new AppError('INVALID_STATE', 'Your supplier account is currently blocked. Contact your administrator.')
    );
  }

  if (supplier.status === 'INACTIVE') {
    return err(
      new AppError('INVALID_STATE', 'Your supplier account is inactive. Contact your administrator.')
    );
  }

  return ok(undefined);
}
