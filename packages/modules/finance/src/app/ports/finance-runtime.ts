/**
 * SHIM — Phase 0 Strangler Fig.
 * Re-exports FinanceDeps from new slice port locations.
 * TODO: Remove once all consumers import from slices/ directly.
 */
import type { IJournalRepo } from "../../slices/gl/ports/journal-repo.js";
import type { IAccountRepo } from "../../slices/gl/ports/account-repo.js";
import type { IFiscalPeriodRepo } from "../../slices/gl/ports/fiscal-period-repo.js";
import type { IGlBalanceRepo } from "../../slices/gl/ports/gl-balance-repo.js";
import type { IJournalAuditRepo } from "../../slices/gl/ports/journal-audit-repo.js";
import type { IPeriodAuditRepo } from "../../slices/gl/ports/period-audit-repo.js";
import type { ILedgerRepo } from "../../slices/gl/ports/ledger-repo.js";
import type { IDocumentNumberGenerator } from "../../slices/gl/ports/document-number-generator.js";
import type { IIdempotencyStore } from "../../shared/ports/idempotency-store.js";
import type { IOutboxWriter } from "../../shared/ports/outbox-writer.js";
import type { IFxRateRepo } from "../../slices/fx/ports/fx-rate-repo.js";
import type { IFxRateApprovalRepo } from "../../slices/fx/ports/fx-rate-approval-repo.js";
import type { IIcAgreementRepo, IIcTransactionRepo } from "../../slices/ic/ports/ic-repo.js";
import type { IIcSettlementRepo } from "../../slices/ic/ports/ic-settlement-repo.js";
import type { IRecurringTemplateRepo } from "../../slices/hub/ports/recurring-template-repo.js";
import type { IBudgetRepo } from "../../slices/hub/ports/budget-repo.js";
import type { IClassificationRuleRepo } from "../../slices/hub/ports/classification-rule-repo.js";
import type { IRevenueContractRepo } from "../../slices/hub/ports/revenue-contract-repo.js";

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
