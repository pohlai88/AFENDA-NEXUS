import type { IJournalRepo } from "./journal-repo.js";
import type { IAccountRepo } from "./account-repo.js";
import type { IFiscalPeriodRepo } from "./fiscal-period-repo.js";
import type { IGlBalanceRepo } from "./gl-balance-repo.js";
import type { IJournalAuditRepo } from "./journal-audit-repo.js";
import type { IPeriodAuditRepo } from "./period-audit-repo.js";
import type { ILedgerRepo } from "./ledger-repo.js";
import type { IDocumentNumberGenerator } from "./document-number-generator.js";

export interface GlDeps {
  readonly journalRepo: IJournalRepo;
  readonly accountRepo: IAccountRepo;
  readonly periodRepo: IFiscalPeriodRepo;
  readonly balanceRepo: IGlBalanceRepo;
  readonly journalAuditRepo: IJournalAuditRepo;
  readonly periodAuditRepo: IPeriodAuditRepo;
  readonly ledgerRepo: ILedgerRepo;
  readonly documentNumberGenerator: IDocumentNumberGenerator;
}
