export type SupplierLegalDocType =
  | 'REGISTRATION_CERTIFICATE'
  | 'TAX_REGISTRATION'
  | 'ARTICLES_OF_INCORPORATION'
  | 'POWER_OF_ATTORNEY'
  | 'BANK_CONFIRMATION_LETTER'
  | 'INSURANCE_CERTIFICATE'
  | 'TRADE_LICENSE'
  | 'GOOD_STANDING_CERTIFICATE'
  | 'BENEFICIAL_OWNERSHIP'
  | 'OTHER';

export type SupplierLegalDocStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';

export interface SupplierLegalDocument {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly docType: SupplierLegalDocType;
  readonly documentNumber: string | null;
  readonly issuingAuthority: string | null;
  readonly issueDate: Date | null;
  readonly expiryDate: Date | null;
  readonly storageKey: string | null;
  readonly checksumSha256: string | null;
  readonly status: SupplierLegalDocStatus;
  readonly rejectionReason: string | null;
  readonly verifiedBy: string | null;
  readonly verifiedAt: Date | null;
  readonly uploadedBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierDocRequirement {
  readonly id: string;
  readonly tenantId: string;
  readonly accountGroup: string;
  readonly docType: SupplierLegalDocType;
  readonly isMandatory: boolean;
  readonly countryCode: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
