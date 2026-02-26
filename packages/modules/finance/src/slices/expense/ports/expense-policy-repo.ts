import type { ExpensePolicy } from '../entities/expense-policy.js';

export interface CreateExpensePolicyInput {
  readonly companyId: string;
  readonly name: string;
  readonly category: string;
  readonly maxAmountPerItem: bigint;
  readonly maxAmountPerClaim: bigint;
  readonly currencyCode: string;
  readonly requiresReceipt: boolean;
  readonly requiresApproval: boolean;
  readonly perDiemRate: bigint | null;
  readonly mileageRateBps: number | null;
}

export interface IExpensePolicyRepo {
  findById(id: string): Promise<ExpensePolicy | null>;
  findByCompany(companyId: string): Promise<readonly ExpensePolicy[]>;
  findByCategory(companyId: string, category: string): Promise<ExpensePolicy | null>;
  findAll(): Promise<readonly ExpensePolicy[]>;
  create(tenantId: string, input: CreateExpensePolicyInput): Promise<ExpensePolicy>;
  update(
    id: string,
    input: Partial<CreateExpensePolicyInput & { isActive: boolean }>
  ): Promise<ExpensePolicy>;
}
