import type { IExpenseClaimRepo } from './expense-claim-repo.js';
import type { IExpensePolicyRepo } from './expense-policy-repo.js';

export interface ExpenseDeps {
  readonly expenseClaimRepo: IExpenseClaimRepo;
  readonly expensePolicyRepo: IExpensePolicyRepo;
}
