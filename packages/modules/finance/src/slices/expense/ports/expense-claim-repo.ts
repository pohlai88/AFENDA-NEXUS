import type { ExpenseClaim } from "../entities/expense-claim.js";
import type { ExpenseClaimLine } from "../entities/expense-claim-line.js";

export interface CreateExpenseClaimInput {
  readonly companyId: string;
  readonly employeeId: string;
  readonly claimNumber: string;
  readonly description: string;
  readonly claimDate: Date;
  readonly totalAmount: bigint;
  readonly currencyCode: string;
  readonly baseCurrencyAmount: bigint;
  readonly lineCount: number;
}

export interface CreateExpenseClaimLineInput {
  readonly claimId: string;
  readonly lineNumber: number;
  readonly expenseDate: Date;
  readonly category: ExpenseClaimLine["category"];
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly baseCurrencyAmount: bigint;
  readonly receiptRef: string | null;
  readonly glAccountId: string;
  readonly costCenterId: string | null;
  readonly projectId: string | null;
  readonly isBillable: boolean;
}

export interface IExpenseClaimRepo {
  findById(id: string): Promise<ExpenseClaim | null>;
  findByEmployee(employeeId: string): Promise<readonly ExpenseClaim[]>;
  findAll(): Promise<readonly ExpenseClaim[]>;
  create(tenantId: string, input: CreateExpenseClaimInput): Promise<ExpenseClaim>;
  update(id: string, input: Partial<Record<string, unknown>>): Promise<ExpenseClaim>;
  findLinesByClaim(claimId: string): Promise<readonly ExpenseClaimLine[]>;
  createLine(tenantId: string, input: CreateExpenseClaimLineInput): Promise<ExpenseClaimLine>;
}
