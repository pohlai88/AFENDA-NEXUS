/**
 * Cost allocation run entity — a batch allocation execution.
 */

export type AllocationRunStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export type AllocationMethodType = 'DIRECT' | 'STEP_DOWN' | 'RECIPROCAL';

export interface CostAllocationRun {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly periodId: string;
  readonly method: AllocationMethodType;
  readonly status: AllocationRunStatus;
  readonly totalAllocated: bigint;
  readonly currencyCode: string;
  readonly lineCount: number;
  readonly executedBy: string;
  readonly executedAt: Date | null;
  readonly reversedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CostAllocationLine {
  readonly id: string;
  readonly runId: string;
  readonly fromCostCenterId: string;
  readonly toCostCenterId: string;
  readonly driverId: string;
  readonly amount: bigint;
  readonly driverQuantity: bigint;
  readonly allocationRate: bigint;
}
