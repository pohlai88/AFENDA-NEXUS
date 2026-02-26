import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { expenseClaims, expenseClaimLines } from '@afenda/db';
import type { ExpenseClaim } from '../entities/expense-claim.js';
import type { ExpenseClaimLine } from '../entities/expense-claim-line.js';
import type {
  IExpenseClaimRepo,
  CreateExpenseClaimInput,
  CreateExpenseClaimLineInput,
} from '../ports/expense-claim-repo.js';

type ClaimRow = typeof expenseClaims.$inferSelect;
type LineRow = typeof expenseClaimLines.$inferSelect;

function mapClaimToDomain(row: ClaimRow): ExpenseClaim {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    employeeId: row.employeeId,
    claimNumber: row.claimNumber,
    description: row.description,
    claimDate: row.claimDate,
    totalAmount: row.totalAmount,
    currencyCode: row.currencyCode,
    baseCurrencyAmount: row.baseCurrencyAmount,
    status: row.status as ExpenseClaim['status'],
    submittedAt: row.submittedAt,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    rejectionReason: row.rejectionReason,
    reimbursedAt: row.reimbursedAt,
    apInvoiceId: row.apInvoiceId,
    lineCount: row.lineCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapLineToDomain(row: LineRow): ExpenseClaimLine {
  return {
    id: row.id,
    tenantId: row.tenantId,
    claimId: row.claimId,
    lineNumber: row.lineNumber,
    expenseDate: row.expenseDate,
    category: row.category as ExpenseClaimLine['category'],
    description: row.description,
    amount: row.amount,
    currencyCode: row.currencyCode,
    baseCurrencyAmount: row.baseCurrencyAmount,
    receiptRef: row.receiptRef,
    glAccountId: row.glAccountId,
    costCenterId: row.costCenterId,
    projectId: row.projectId,
    isBillable: row.isBillable,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleExpenseClaimRepo implements IExpenseClaimRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<ExpenseClaim | null> {
    const rows = await this.db
      .select()
      .from(expenseClaims)
      .where(eq(expenseClaims.id, id))
      .limit(1);
    return rows[0] ? mapClaimToDomain(rows[0]) : null;
  }

  async findByEmployee(employeeId: string): Promise<readonly ExpenseClaim[]> {
    const rows = await this.db
      .select()
      .from(expenseClaims)
      .where(eq(expenseClaims.employeeId, employeeId));
    return rows.map(mapClaimToDomain);
  }

  async findAll(): Promise<readonly ExpenseClaim[]> {
    const rows = await this.db.select().from(expenseClaims);
    return rows.map(mapClaimToDomain);
  }

  async create(tenantId: string, input: CreateExpenseClaimInput): Promise<ExpenseClaim> {
    const [row] = await this.db
      .insert(expenseClaims)
      .values({
        tenantId,
        companyId: input.companyId,
        employeeId: input.employeeId,
        claimNumber: input.claimNumber,
        description: input.description,
        claimDate: input.claimDate,
        totalAmount: input.totalAmount,
        currencyCode: input.currencyCode,
        baseCurrencyAmount: input.baseCurrencyAmount,
        lineCount: input.lineCount,
      })
      .returning();
    return mapClaimToDomain(row!);
  }

  async update(id: string, input: Partial<Record<string, unknown>>): Promise<ExpenseClaim> {
    const [row] = await this.db
      .update(expenseClaims)
      .set(input)
      .where(eq(expenseClaims.id, id))
      .returning();
    return mapClaimToDomain(row!);
  }

  async findLinesByClaim(claimId: string): Promise<readonly ExpenseClaimLine[]> {
    const rows = await this.db
      .select()
      .from(expenseClaimLines)
      .where(eq(expenseClaimLines.claimId, claimId));
    return rows.map(mapLineToDomain);
  }

  async createLine(
    tenantId: string,
    input: CreateExpenseClaimLineInput
  ): Promise<ExpenseClaimLine> {
    const [row] = await this.db
      .insert(expenseClaimLines)
      .values({
        tenantId,
        claimId: input.claimId,
        lineNumber: input.lineNumber,
        expenseDate: input.expenseDate,
        category: input.category,
        description: input.description,
        amount: input.amount,
        currencyCode: input.currencyCode,
        baseCurrencyAmount: input.baseCurrencyAmount,
        receiptRef: input.receiptRef,
        glAccountId: input.glAccountId,
        costCenterId: input.costCenterId,
        projectId: input.projectId,
        isBillable: input.isBillable,
      })
      .returning();
    return mapLineToDomain(row!);
  }
}
