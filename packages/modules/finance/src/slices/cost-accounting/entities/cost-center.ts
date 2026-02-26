/**
 * Cost center entity — node in the cost center hierarchy.
 */

export type CostCenterStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';

export interface CostCenter {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly level: number;
  readonly status: CostCenterStatus;
  readonly managerId: string | null;
  readonly currencyCode: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
