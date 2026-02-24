import type { CostAllocationRun, CostAllocationLine } from "../entities/cost-allocation-run.js";

export interface CreateAllocationRunInput {
  readonly companyId: string;
  readonly periodId: string;
  readonly method: CostAllocationRun["method"];
  readonly currencyCode: string;
  readonly executedBy: string;
}

export interface CreateAllocationLineInput {
  readonly runId: string;
  readonly fromCostCenterId: string;
  readonly toCostCenterId: string;
  readonly driverId: string;
  readonly amount: bigint;
  readonly driverQuantity: bigint;
  readonly allocationRate: bigint;
}

export interface ICostAllocationRunRepo {
  findById(id: string): Promise<CostAllocationRun | null>;
  findByPeriod(companyId: string, periodId: string): Promise<readonly CostAllocationRun[]>;
  findAll(): Promise<readonly CostAllocationRun[]>;
  create(tenantId: string, input: CreateAllocationRunInput): Promise<CostAllocationRun>;
  updateStatus(id: string, status: CostAllocationRun["status"], totalAllocated: bigint, lineCount: number): Promise<CostAllocationRun>;
  createLines(tenantId: string, lines: readonly CreateAllocationLineInput[]): Promise<readonly CostAllocationLine[]>;
  findLinesByRun(runId: string): Promise<readonly CostAllocationLine[]>;
}
