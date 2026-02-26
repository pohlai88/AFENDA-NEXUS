import type { IDeferredTaxItemRepo } from './deferred-tax-item-repo.js';

export interface DeferredTaxDeps {
  readonly deferredTaxItemRepo: IDeferredTaxItemRepo;
}
