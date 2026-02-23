import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { creditReviews } from "@afenda/db";
import type { CreditReview } from "../entities/credit-review.js";
import type { ICreditReviewRepo, CreateCreditReviewInput } from "../ports/credit-review-repo.js";

type Row = typeof creditReviews.$inferSelect;

function mapToDomain(row: Row): CreditReview {
  return {
    id: row.id,
    tenantId: row.tenantId,
    creditLimitId: row.creditLimitId,
    customerId: row.customerId,
    reviewDate: row.reviewDate,
    previousLimit: row.previousLimit,
    proposedLimit: row.proposedLimit,
    approvedLimit: row.approvedLimit,
    currencyCode: row.currencyCode,
    outcome: row.outcome as CreditReview["outcome"],
    riskRating: row.riskRating,
    notes: row.notes,
    reviewedBy: row.reviewedBy,
    approvedBy: row.approvedBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleCreditReviewRepo implements ICreditReviewRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<CreditReview | null> {
    const rows = await this.db.select().from(creditReviews).where(eq(creditReviews.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCustomer(customerId: string): Promise<readonly CreditReview[]> {
    const rows = await this.db.select().from(creditReviews).where(eq(creditReviews.customerId, customerId));
    return rows.map(mapToDomain);
  }

  async findByCreditLimit(creditLimitId: string): Promise<readonly CreditReview[]> {
    const rows = await this.db.select().from(creditReviews).where(eq(creditReviews.creditLimitId, creditLimitId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateCreditReviewInput): Promise<CreditReview> {
    const [row] = await this.db.insert(creditReviews).values({
      tenantId,
      creditLimitId: input.creditLimitId,
      customerId: input.customerId,
      reviewDate: input.reviewDate,
      previousLimit: input.previousLimit,
      proposedLimit: input.proposedLimit,
      approvedLimit: input.approvedLimit,
      currencyCode: input.currencyCode,
      outcome: input.outcome,
      riskRating: input.riskRating,
      notes: input.notes,
      reviewedBy: input.reviewedBy,
      approvedBy: input.approvedBy,
    }).returning();
    return mapToDomain(row!);
  }
}
