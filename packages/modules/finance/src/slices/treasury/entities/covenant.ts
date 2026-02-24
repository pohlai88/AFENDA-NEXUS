/**
 * Covenant entity — loan covenant monitoring.
 */

export type CovenantType = "DEBT_TO_EQUITY" | "INTEREST_COVERAGE" | "CURRENT_RATIO" | "DEBT_SERVICE_COVERAGE" | "LEVERAGE" | "CUSTOM";
export type CovenantStatus = "COMPLIANT" | "WARNING" | "BREACHED";

export interface Covenant {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly lenderId: string;
  readonly lenderName: string;
  readonly covenantType: CovenantType;
  readonly description: string;
  readonly thresholdValue: number;
  readonly currentValue: number | null;
  readonly status: CovenantStatus;
  readonly testFrequency: string;
  readonly lastTestDate: Date | null;
  readonly nextTestDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
