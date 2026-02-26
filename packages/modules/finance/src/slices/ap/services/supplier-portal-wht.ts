import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { WhtCertificate } from '../../../slices/tax/entities/wht-certificate.js';
import type { IWhtCertificateRepo } from '../../../slices/tax/ports/wht-certificate-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';

/**
 * N5: Supplier self-service WHT certificate/exemption management.
 *
 * Provides supplier-scoped read access to WHT certificates.
 * Uses the tax slice's IWhtCertificateRepo (via TaxDeps in FinanceDeps)
 * since that's the repo the runtime provides. The tax slice models
 * certificates with payeeId (= supplierId in AP context).
 *
 * Certificates are issued by internal AP processes;
 * suppliers can only view/download them via this service.
 */

export interface GetSupplierWhtCertificatesInput {
  readonly tenantId: string;
  readonly supplierId: string;
}

export async function getSupplierWhtCertificates(
  input: GetSupplierWhtCertificatesInput,
  deps: {
    whtCertificateRepo: IWhtCertificateRepo;
    supplierRepo: ISupplierRepo;
  }
): Promise<Result<readonly WhtCertificate[]>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('VALIDATION', 'Supplier not found'));
  }

  const certificates = await deps.whtCertificateRepo.findByPayee(input.supplierId);
  return ok(certificates);
}

export interface GetSupplierWhtCertificateByIdInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly certificateId: string;
}

export async function getSupplierWhtCertificateById(
  input: GetSupplierWhtCertificateByIdInput,
  deps: {
    whtCertificateRepo: IWhtCertificateRepo;
  }
): Promise<Result<WhtCertificate>> {
  const cert = await deps.whtCertificateRepo.findById(input.certificateId);
  if (!cert) {
    return err(new AppError('NOT_FOUND', 'WHT certificate not found'));
  }

  if (cert.payeeId !== input.supplierId) {
    return err(new AppError('VALIDATION', 'Certificate does not belong to this supplier'));
  }

  return ok(cert);
}
