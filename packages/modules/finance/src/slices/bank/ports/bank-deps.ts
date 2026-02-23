import type { IBankStatementRepo } from "./bank-statement-repo.js";
import type { IBankMatchRepo } from "./bank-match-repo.js";
import type { IBankReconciliationRepo } from "./bank-reconciliation-repo.js";

export interface BankDeps {
  readonly bankStatementRepo: IBankStatementRepo;
  readonly bankMatchRepo: IBankMatchRepo;
  readonly bankReconciliationRepo: IBankReconciliationRepo;
}
