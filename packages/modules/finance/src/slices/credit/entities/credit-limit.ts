/**
 * Credit limit entity — per-customer credit limit with review tracking.
 */

export type CreditStatus = "ACTIVE" | "ON_HOLD" | "SUSPENDED" | "CLOSED";

export interface CreditLimit {
  readonly id: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly companyId: string;
  readonly creditLimit: bigint;
  readonly currencyCode: string;
  readonly currentExposure: bigint;
  readonly availableCredit: bigint;
  readonly status: CreditStatus;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly lastReviewDate: Date | null;
  readonly nextReviewDate: Date | null;
  readonly riskRating: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
