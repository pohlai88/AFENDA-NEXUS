export type SupplierContactRole =
  | 'AP_CONTACT'
  | 'SALES_REP'
  | 'COMPLIANCE_OFFICER'
  | 'LOGISTICS'
  | 'EXECUTIVE'
  | 'OTHER';

export interface SupplierContact {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly siteId: string | null;
  readonly role: SupplierContactRole;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly jobTitle: string | null;
  readonly isPrimary: boolean;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
