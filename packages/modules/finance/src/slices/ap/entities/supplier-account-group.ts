import type { SupplierAccountGroup } from './supplier';

export interface SupplierAccountGroupConfig {
  readonly id: string;
  readonly tenantId: string;
  readonly accountGroup: SupplierAccountGroup;
  readonly label: string;
  readonly requiresApproval: boolean;
  readonly requiresTaxVerification: boolean;
  readonly requiresBankVerification: boolean;
  readonly allowOneTimeUse: boolean;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
