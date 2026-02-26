/**
 * Project entity — project master with budget, dates, and billing type.
 */

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type BillingType = 'FIXED_FEE' | 'TIME_AND_MATERIALS' | 'MILESTONE' | 'COST_PLUS';

export interface Project {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly projectCode: string;
  readonly name: string;
  readonly description: string | null;
  readonly customerId: string | null;
  readonly managerId: string;
  readonly status: ProjectStatus;
  readonly billingType: BillingType;
  readonly budgetAmount: bigint;
  readonly actualCost: bigint;
  readonly billedAmount: bigint;
  readonly currencyCode: string;
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly completionPct: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
