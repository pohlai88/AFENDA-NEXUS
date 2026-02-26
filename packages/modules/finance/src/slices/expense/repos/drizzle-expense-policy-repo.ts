import { eq, and } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { expensePolicies } from '@afenda/db';
import type { ExpensePolicy } from '../entities/expense-policy.js';
import type { IExpensePolicyRepo, CreateExpensePolicyInput } from '../ports/expense-policy-repo.js';

type Row = typeof expensePolicies.$inferSelect;

function mapToDomain(row: Row): ExpensePolicy {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    name: row.name,
    category: row.category,
    maxAmountPerItem: row.maxAmountPerItem,
    maxAmountPerClaim: row.maxAmountPerClaim,
    currencyCode: row.currencyCode,
    requiresReceipt: row.requiresReceipt,
    requiresApproval: row.requiresApproval,
    perDiemRate: row.perDiemRate,
    mileageRateBps: row.mileageRateBps,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleExpensePolicyRepo implements IExpensePolicyRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<ExpensePolicy | null> {
    const rows = await this.db
      .select()
      .from(expensePolicies)
      .where(eq(expensePolicies.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly ExpensePolicy[]> {
    const rows = await this.db
      .select()
      .from(expensePolicies)
      .where(eq(expensePolicies.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async findByCategory(companyId: string, category: string): Promise<ExpensePolicy | null> {
    const rows = await this.db
      .select()
      .from(expensePolicies)
      .where(and(eq(expensePolicies.companyId, companyId), eq(expensePolicies.category, category)))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly ExpensePolicy[]> {
    const rows = await this.db.select().from(expensePolicies);
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateExpensePolicyInput): Promise<ExpensePolicy> {
    const [row] = await this.db
      .insert(expensePolicies)
      .values({
        tenantId,
        companyId: input.companyId,
        name: input.name,
        category: input.category,
        maxAmountPerItem: input.maxAmountPerItem,
        maxAmountPerClaim: input.maxAmountPerClaim,
        currencyCode: input.currencyCode,
        requiresReceipt: input.requiresReceipt,
        requiresApproval: input.requiresApproval,
        perDiemRate: input.perDiemRate,
        mileageRateBps: input.mileageRateBps,
      })
      .returning();
    return mapToDomain(row!);
  }

  async update(id: string, input: Partial<Record<string, unknown>>): Promise<ExpensePolicy> {
    const [row] = await this.db
      .update(expensePolicies)
      .set(input)
      .where(eq(expensePolicies.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
