import type { CostDriver, CostDriverValue } from '../entities/cost-driver.js';

export interface CreateCostDriverInput {
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly driverType: CostDriver['driverType'];
  readonly unitOfMeasure: string;
}

export interface UpsertDriverValueInput {
  readonly driverId: string;
  readonly costCenterId: string;
  readonly periodId: string;
  readonly quantity: bigint;
}

export interface ICostDriverRepo {
  findById(id: string): Promise<CostDriver | null>;
  findByCompany(companyId: string): Promise<readonly CostDriver[]>;
  findAll(): Promise<readonly CostDriver[]>;
  create(tenantId: string, input: CreateCostDriverInput): Promise<CostDriver>;
  update(
    id: string,
    input: Partial<CreateCostDriverInput & { isActive: boolean }>
  ): Promise<CostDriver>;
  getDriverValues(driverId: string, periodId: string): Promise<readonly CostDriverValue[]>;
  upsertDriverValue(tenantId: string, input: UpsertDriverValueInput): Promise<CostDriverValue>;
}
