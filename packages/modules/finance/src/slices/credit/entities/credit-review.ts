/**
 * Credit review entity — periodic review of a customer's credit standing.
 */

export type ReviewOutcome = "APPROVED" | "REDUCED" | "SUSPENDED" | "UNCHANGED";

export interface CreditReview {
  readonly id: string;
  readonly tenantId: string;
  readonly creditLimitId: string;
  readonly customerId: string;
  readonly reviewDate: Date;
  readonly previousLimit: bigint;
  readonly proposedLimit: bigint;
  readonly approvedLimit: bigint;
  readonly currencyCode: string;
  readonly outcome: ReviewOutcome;
  readonly riskRating: string | null;
  readonly notes: string | null;
  readonly reviewedBy: string;
  readonly approvedBy: string | null;
  readonly createdAt: Date;
}
