import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { ISupplierRepo, UpdateSupplierInput } from '../ports/supplier-repo.js';
import type { ISupplierTaxRepo } from '../ports/supplier-tax-repo.js';
import type { ISupplierLegalDocRepo } from '../ports/supplier-legal-doc-repo.js';
import type { ISupplierAccountGroupRepo } from '../ports/supplier-account-group-repo.js';
import type { Supplier } from '../entities/supplier.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface ActivationReadiness {
  readonly supplierId: string;
  readonly isReady: boolean;
  readonly missingDocs: { docType: string; isMandatory: boolean }[];
  readonly taxVerified: boolean;
  readonly bankVerified: boolean;
  readonly approvalRequired: boolean;
  readonly approvalGranted: boolean;
}

export interface CheckActivationInput {
  readonly supplierId: string;
  readonly tenantId: string;
}

export interface ActivateSupplierInput {
  readonly supplierId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly correlationId: string;
}

export async function checkActivationReadiness(
  input: CheckActivationInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierTaxRepo?: ISupplierTaxRepo;
    supplierLegalDocRepo?: ISupplierLegalDocRepo;
    supplierAccountGroupRepo?: ISupplierAccountGroupRepo;
  }
): Promise<Result<ActivationReadiness>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) return err(new AppError('NOT_FOUND', 'Supplier not found'));

  const supplier = supplierResult.value;

  let taxVerified = true;
  let bankVerified = true;
  let approvalRequired = false;
  const missingDocs: { docType: string; isMandatory: boolean }[] = [];

  if (deps.supplierAccountGroupRepo) {
    const config = await deps.supplierAccountGroupRepo.findByAccountGroup(
      input.tenantId,
      supplier.accountGroup
    );
    if (config) {
      approvalRequired = config.requiresApproval;

      if (config.requiresTaxVerification && deps.supplierTaxRepo) {
        const taxRegs = await deps.supplierTaxRepo.findBySupplierId(input.supplierId);
        taxVerified = taxRegs.some((t) => t.isVerified);
      }

      if (config.requiresBankVerification) {
        bankVerified = supplier.bankAccounts.some((b) => b.isVerified);
      }
    }
  }

  if (deps.supplierLegalDocRepo) {
    const requirements = await deps.supplierLegalDocRepo.findDocRequirements(
      input.tenantId,
      supplier.accountGroup,
      supplier.countryOfIncorporation ?? undefined
    );
    const existingDocs = await deps.supplierLegalDocRepo.findBySupplierId(input.supplierId);

    for (const req of requirements) {
      if (!req.isActive) continue;
      const hasDoc = existingDocs.some(
        (d) => d.docType === req.docType && (d.status === 'VERIFIED' || d.status === 'PENDING')
      );
      if (!hasDoc) {
        missingDocs.push({ docType: req.docType, isMandatory: req.isMandatory });
      }
    }
  }

  const approvalGranted = supplier.onboardingStatus === 'ACTIVE';
  const hasMandatoryMissing = missingDocs.some((d) => d.isMandatory);

  const isReady =
    !hasMandatoryMissing &&
    taxVerified &&
    bankVerified &&
    (!approvalRequired || approvalGranted);

  return ok({
    supplierId: input.supplierId,
    isReady,
    missingDocs,
    taxVerified,
    bankVerified,
    approvalRequired,
    approvalGranted,
  });
}

export async function activateSupplier(
  input: ActivateSupplierInput,
  deps: {
    supplierRepo: ISupplierRepo;
    supplierTaxRepo?: ISupplierTaxRepo;
    supplierLegalDocRepo?: ISupplierLegalDocRepo;
    supplierAccountGroupRepo?: ISupplierAccountGroupRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<Supplier>> {
  const readiness = await checkActivationReadiness(
    { supplierId: input.supplierId, tenantId: input.tenantId },
    deps
  );
  if (!readiness.ok) return readiness;

  if (!readiness.value.isReady) {
    return err(
      new AppError('VALIDATION', 'Supplier does not meet activation requirements')
    );
  }

  const updateInput: UpdateSupplierInput = { onboardingStatus: 'ACTIVE' };
  const result = await deps.supplierRepo.update(input.supplierId, updateInput);
  if (!result.ok) return result;

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.SUPPLIER_ACTIVATED,
    payload: {
      supplierId: input.supplierId,
      userId: input.userId,
      correlationId: input.correlationId,
    },
  });

  return result;
}
