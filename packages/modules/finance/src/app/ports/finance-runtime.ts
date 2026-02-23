import type { IJournalRepo } from "./journal-repo.js";
import type { IAccountRepo } from "./account-repo.js";
import type { IFiscalPeriodRepo } from "./fiscal-period-repo.js";
import type { IGlBalanceRepo } from "./gl-balance-repo.js";
import type { IIdempotencyStore } from "./idempotency-store.js";
import type { IOutboxWriter } from "./outbox-writer.js";
import type { IJournalAuditRepo } from "./journal-audit-repo.js";
import type { IPeriodAuditRepo } from "./period-audit-repo.js";
import type { IFxRateRepo } from "./fx-rate-repo.js";
import type { ILedgerRepo } from "./ledger-repo.js";
import type { IIcAgreementRepo, IIcTransactionRepo } from "./ic-repo.js";
import type { IRecurringTemplateRepo } from "./recurring-template-repo.js";
import type { IBudgetRepo } from "./budget-repo.js";
import type { IIcSettlementRepo } from "./ic-settlement-repo.js";
import type { IClassificationRuleRepo } from "./classification-rule-repo.js";
import type { IFxRateApprovalRepo } from "./fx-rate-approval-repo.js";
import type { IRevenueContractRepo } from "./revenue-contract-repo.js";
import type { IDocumentNumberGenerator } from "./document-number-generator.js";

export interface FinanceDeps {
  readonly journalRepo: IJournalRepo;
  readonly accountRepo: IAccountRepo;
  readonly periodRepo: IFiscalPeriodRepo;
  readonly balanceRepo: IGlBalanceRepo;
  readonly idempotencyStore: IIdempotencyStore;
  readonly outboxWriter: IOutboxWriter;
  readonly journalAuditRepo: IJournalAuditRepo;
  readonly fxRateRepo: IFxRateRepo;
  readonly ledgerRepo: ILedgerRepo;
  readonly icAgreementRepo: IIcAgreementRepo;
  readonly icTransactionRepo: IIcTransactionRepo;
  readonly recurringTemplateRepo: IRecurringTemplateRepo;
  readonly budgetRepo: IBudgetRepo;
  readonly periodAuditRepo: IPeriodAuditRepo;
  readonly icSettlementRepo: IIcSettlementRepo;
  readonly classificationRuleRepo: IClassificationRuleRepo;
  readonly fxRateApprovalRepo: IFxRateApprovalRepo;
  readonly revenueContractRepo: IRevenueContractRepo;
  readonly documentNumberGenerator: IDocumentNumberGenerator;
}

export interface FinanceRuntime {
  withTenant<T>(
    ctx: { tenantId: string; userId: string },
    fn: (deps: FinanceDeps) => Promise<T>,
  ): Promise<T>;
}
