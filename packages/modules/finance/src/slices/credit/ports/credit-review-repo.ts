import type { CreditReview } from "../entities/credit-review.js";

export interface CreateCreditReviewInput {
  readonly creditLimitId: string;
  readonly customerId: string;
  readonly reviewDate: Date;
  readonly previousLimit: bigint;
  readonly proposedLimit: bigint;
  readonly approvedLimit: bigint;
  readonly currencyCode: string;
  readonly outcome: CreditReview["outcome"];
  readonly riskRating: string | null;
  readonly notes: string | null;
  readonly reviewedBy: string;
  readonly approvedBy: string | null;
}

export interface ICreditReviewRepo {
  findById(id: string): Promise<CreditReview | null>;
  findByCustomer(customerId: string): Promise<readonly CreditReview[]>;
  findByCreditLimit(creditLimitId: string): Promise<readonly CreditReview[]>;
  create(tenantId: string, input: CreateCreditReviewInput): Promise<CreditReview>;
}
