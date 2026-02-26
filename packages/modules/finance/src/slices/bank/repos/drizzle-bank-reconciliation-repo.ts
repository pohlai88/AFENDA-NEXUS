import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { bankReconciliations } from '@afenda/db';
import type { BankReconciliation } from '../entities/bank-reconciliation.js';
import type {
  IBankReconciliationRepo,
  CreateBankReconciliationInput,
} from '../ports/bank-reconciliation-repo.js';

type Row = typeof bankReconciliations.$inferSelect;

function mapToDomain(row: Row): BankReconciliation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    bankAccountId: row.bankAccountId,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    statementBalance: row.statementBalance,
    glBalance: row.glBalance,
    adjustedStatementBalance: row.adjustedStatementBalance,
    adjustedGlBalance: row.adjustedGlBalance,
    outstandingChecks: row.outstandingChecks,
    depositsInTransit: row.depositsInTransit,
    difference: row.difference,
    currencyCode: row.currencyCode,
    status: row.status as BankReconciliation['status'],
    matchedCount: row.matchedCount,
    unmatchedCount: row.unmatchedCount,
    signedOffAt: row.signedOffAt,
    signedOffBy: row.signedOffBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleBankReconciliationRepo implements IBankReconciliationRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<BankReconciliation | null> {
    const rows = await this.db
      .select()
      .from(bankReconciliations)
      .where(eq(bankReconciliations.id, id))
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findByBankAccount(bankAccountId: string): Promise<readonly BankReconciliation[]> {
    const rows = await this.db
      .select()
      .from(bankReconciliations)
      .where(eq(bankReconciliations.bankAccountId, bankAccountId));
    return rows.map(mapToDomain);
  }

  async findAll(): Promise<readonly BankReconciliation[]> {
    const rows = await this.db.select().from(bankReconciliations);
    return rows.map(mapToDomain);
  }

  async create(
    tenantId: string,
    input: CreateBankReconciliationInput
  ): Promise<BankReconciliation> {
    const [row] = await this.db
      .insert(bankReconciliations)
      .values({
        tenantId,
        bankAccountId: input.bankAccountId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        statementBalance: input.statementBalance,
        glBalance: input.glBalance,
        adjustedStatementBalance: input.adjustedStatementBalance,
        adjustedGlBalance: input.adjustedGlBalance,
        outstandingChecks: input.outstandingChecks,
        depositsInTransit: input.depositsInTransit,
        difference: input.difference,
        currencyCode: input.currencyCode,
        matchedCount: input.matchedCount,
        unmatchedCount: input.unmatchedCount,
      })
      .returning();
    return mapToDomain(row!);
  }

  async signOff(id: string, signedOffBy: string): Promise<BankReconciliation> {
    const [row] = await this.db
      .update(bankReconciliations)
      .set({
        status: 'SIGNED_OFF',
        signedOffAt: new Date(),
        signedOffBy,
      })
      .where(eq(bankReconciliations.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
