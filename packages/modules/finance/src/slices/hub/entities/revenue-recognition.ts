import type { TenantId, CompanyId } from "@afenda/core";

/**
 * @see AH-04 — Revenue recognition schedules
 * @see AIS A-24 — Revenue recognition service
 *
 * Represents a revenue contract with a recognition schedule.
 * Revenue is recognized over time (straight-line or milestone-based)
 * from deferred revenue to earned revenue.
 */

export type RecognitionMethod = "STRAIGHT_LINE" | "MILESTONE" | "PERCENTAGE_OF_COMPLETION";
export type ContractStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface RevenueContract {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;
  readonly contractNumber: string;
  readonly customerName: string;
  readonly totalAmount: bigint;
  readonly currency: string;
  readonly recognitionMethod: RecognitionMethod;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly deferredAccountId: string;
  readonly revenueAccountId: string;
  readonly status: ContractStatus;
  readonly recognizedToDate: bigint;
  readonly createdAt: Date;
}

export interface RecognitionMilestone {
  readonly id: string;
  readonly contractId: string;
  readonly description: string;
  readonly amount: bigint;
  readonly targetDate: Date;
  readonly completedDate?: Date;
  readonly isCompleted: boolean;
}

export interface RecognitionScheduleEntry {
  readonly periodId: string;
  readonly amount: bigint;
  readonly cumulativeAmount: bigint;
  readonly isRecognized: boolean;
}
