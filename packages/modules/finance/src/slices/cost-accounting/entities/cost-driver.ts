/**
 * Cost driver entity — basis for allocating overhead to cost objects.
 */

export type DriverType = "HEADCOUNT" | "MACHINE_HOURS" | "DIRECT_LABOR" | "FLOOR_AREA" | "REVENUE" | "UNITS_PRODUCED" | "CUSTOM";

export interface CostDriver {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly driverType: DriverType;
  readonly unitOfMeasure: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CostDriverValue {
  readonly driverId: string;
  readonly costCenterId: string;
  readonly periodId: string;
  readonly quantity: bigint;
}
