import type { ICreditLimitRepo } from './credit-limit-repo.js';
import type { ICreditReviewRepo } from './credit-review-repo.js';

export interface CreditDeps {
  readonly creditLimitRepo: ICreditLimitRepo;
  readonly creditReviewRepo: ICreditReviewRepo;
}
