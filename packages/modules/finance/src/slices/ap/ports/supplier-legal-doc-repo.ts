import type { Result } from '@afenda/core';
import type {
  SupplierLegalDocument,
  SupplierLegalDocType,
  SupplierDocRequirement,
} from '../entities/supplier-legal-doc.js';
import type { SupplierAccountGroup } from '../entities/supplier.js';

export interface CreateSupplierLegalDocInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly docType: SupplierLegalDocType;
  readonly documentNumber: string | null;
  readonly issuingAuthority: string | null;
  readonly issueDate: Date | null;
  readonly expiryDate: Date | null;
  readonly storageKey: string | null;
  readonly checksumSha256: string | null;
  readonly uploadedBy: string;
}

export interface UpsertDocRequirementInput {
  readonly tenantId: string;
  readonly accountGroup: SupplierAccountGroup;
  readonly docType: SupplierLegalDocType;
  readonly isMandatory: boolean;
  readonly countryCode: string | null;
  readonly isActive: boolean;
}

export interface ISupplierLegalDocRepo {
  create(input: CreateSupplierLegalDocInput): Promise<Result<SupplierLegalDocument>>;
  findBySupplierId(supplierId: string): Promise<readonly SupplierLegalDocument[]>;
  verify(docId: string, verifiedBy: string): Promise<Result<SupplierLegalDocument>>;
  reject(
    docId: string,
    rejectionReason: string
  ): Promise<Result<SupplierLegalDocument>>;

  upsertDocRequirement(input: UpsertDocRequirementInput): Promise<Result<SupplierDocRequirement>>;
  findDocRequirements(
    tenantId: string,
    accountGroup: SupplierAccountGroup,
    countryCode?: string
  ): Promise<readonly SupplierDocRequirement[]>;
  findAllDocRequirements(tenantId: string): Promise<readonly SupplierDocRequirement[]>;
}
