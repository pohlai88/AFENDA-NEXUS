import type { IRecurringTemplateRepo } from './recurring-template-repo.js';
import type { IBudgetRepo } from './budget-repo.js';
import type { IClassificationRuleRepo } from './classification-rule-repo.js';
import type { IRevenueContractRepo } from './revenue-contract-repo.js';

export interface HubDeps {
  readonly recurringTemplateRepo: IRecurringTemplateRepo;
  readonly budgetRepo: IBudgetRepo;
  readonly classificationRuleRepo: IClassificationRuleRepo;
  readonly revenueContractRepo: IRevenueContractRepo;
}
