import type { Result } from '@afenda/core';
import type { SupplierAccountGroupConfig } from '../entities/supplier-account-group.js';
import type { SupplierAccountGroup } from '../entities/supplier.js';

export interface UpsertAccountGroupConfigInput {
  readonly tenantId: string;
  readonly accountGroup: SupplierAccountGroup;
  readonly label: string;
  readonly requiresApproval: boolean;
  readonly requiresTaxVerification: boolean;
  readonly requiresBankVerification: boolean;
  readonly allowOneTimeUse: boolean;
  readonly isActive: boolean;
}

export interface ISupplierAccountGroupRepo {
  upsert(input: UpsertAccountGroupConfigInput): Promise<Result<SupplierAccountGroupConfig>>;
  findAll(tenantId: string): Promise<readonly SupplierAccountGroupConfig[]>;
  findByAccountGroup(
    tenantId: string,
    accountGroup: SupplierAccountGroup
  ): Promise<SupplierAccountGroupConfig | null>;
}
