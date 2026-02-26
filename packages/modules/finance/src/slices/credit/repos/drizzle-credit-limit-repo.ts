import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { creditLimits } from '@afenda/db';
import type { CreditLimit } from '../entities/credit-limit.js';
import type { ICreditLimitRepo, CreateCreditLimitInput } from '../ports/credit-limit-repo.js';

type Row = typeof creditLimits.$inferSelect;

function mapToDomain(row: Row): CreditLimit {
  return {
    id: row.id,
    tenantId: row.tenantId,
    customerId: row.customerId,
    companyId: row.companyId,
    creditLimit: row.creditLimit,
    currencyCode: row.currencyCode,
    currentExposure: row.currentExposure,
    availableCredit: row.availableCredit,
    status: row.status as CreditLimit['status'],
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    lastReviewDate: row.lastReviewDate,
    nextReviewDate: row.nextReviewDate,
    riskRating: row.riskRating,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCreditLimitRepo implements ICreditLimitRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<CreditLimit | null> {
    const rows = await this.db.select().from(creditLimits).where(eq(creditLimits.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCustomer(customerId: string): Promise<CreditLimit | null> {
    const rows = await this.db
      .select()
      .from(creditLimits)
      .where(eq(creditLimits.customerId, customerId))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly CreditLimit[]> {
    const rows = await this.db
      .select()
      .from(creditLimits)
      .where(eq(creditLimits.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly CreditLimit[]> {
    const rows = await this.db.select().from(creditLimits);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateCreditLimitInput): Promise<CreditLimit> {
    const availableCredit = input.creditLimit;
    const [row] = await this.db
      .insert(creditLimits)
      .values({
        tenantId,
        customerId: input.customerId,
        companyId: input.companyId,
        creditLimit: input.creditLimit,
        currencyCode: input.currencyCode,
        availableCredit,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
        riskRating: input.riskRating,
        approvedBy: input.approvedBy,
        approvedAt: input.approvedBy ? new Date() : null,
      })
      .returning();
    return mapToDomain(row!);
  }

  async update(id: string, input: Partial<Record<string, unknown>>): Promise<CreditLimit> {
    const [row] = await this.db
      .update(creditLimits)
      .set(input)
      .where(eq(creditLimits.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
