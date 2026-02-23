/**
 * SHIM — Phase 0 Strangler Fig.
 * Re-exports ports and services from new slice locations.
 * TODO: Remove once all consumers import from slices/ directly.
 */

// ─── GL ports ───────────────────────────────────────────────────────────────
export type { IJournalRepo, CreateJournalInput } from "../slices/gl/ports/journal-repo.js";
export type { IAccountRepo } from "../slices/gl/ports/account-repo.js";
export type { IFiscalPeriodRepo } from "../slices/gl/ports/fiscal-period-repo.js";
export type { IGlBalanceRepo, BalanceUpsertLine } from "../slices/gl/ports/gl-balance-repo.js";
export type { IJournalAuditRepo, AuditLogInput } from "../slices/gl/ports/journal-audit-repo.js";
export type { IPeriodAuditRepo, PeriodAuditLogInput } from "../slices/gl/ports/period-audit-repo.js";
export type { ILedgerRepo } from "../slices/gl/ports/ledger-repo.js";

// ─── Shared ports ───────────────────────────────────────────────────────────
export type { IIdempotencyStore, IdempotencyClaimInput, IdempotencyResult } from "../shared/ports/idempotency-store.js";
export type { IOutboxWriter, OutboxEvent } from "../shared/ports/outbox-writer.js";

// ─── Finance runtime (stays in app/ports for now) ───────────────────────────
export type { FinanceRuntime, FinanceDeps } from "./ports/finance-runtime.js";

// ─── FX ports ───────────────────────────────────────────────────────────────
export type { IFxRateRepo } from "../slices/fx/ports/fx-rate-repo.js";

// ─── IC ports ───────────────────────────────────────────────────────────────
export type { IIcAgreementRepo, IIcTransactionRepo, CreateIcDocumentInput } from "../slices/ic/ports/ic-repo.js";
export type { IIcSettlementRepo, CreateIcSettlementInput } from "../slices/ic/ports/ic-settlement-repo.js";

// ─── Hub ports ──────────────────────────────────────────────────────────────
export type { IRecurringTemplateRepo, CreateRecurringTemplateInput } from "../slices/hub/ports/recurring-template-repo.js";
export type { IBudgetRepo, UpsertBudgetEntryInput } from "../slices/hub/ports/budget-repo.js";

// ─── GL services ────────────────────────────────────────────────────────────
export { postJournal, type PostJournalInput } from "../slices/gl/services/post-journal.js";
export { createJournal, type CreateJournalRequest } from "../slices/gl/services/create-journal.js";
export { getJournal } from "../slices/gl/services/get-journal.js";
export { reverseJournal, type ReverseJournalInput } from "../slices/gl/services/reverse-journal.js";
export { voidJournal } from "../slices/gl/services/void-journal.js";
export { getTrialBalance, type GetTrialBalanceInput } from "../slices/gl/services/get-trial-balance.js";
export { closePeriod } from "../slices/gl/services/close-period.js";
export { lockPeriod } from "../slices/gl/services/lock-period.js";
export { reopenPeriod } from "../slices/gl/services/reopen-period.js";
export { processRecurringJournals, type ProcessRecurringInput, type ProcessRecurringResult } from "../slices/gl/services/process-recurring-journals.js";

// ─── IC services ────────────────────────────────────────────────────────────
export { createIcTransaction, type CreateIcTransactionInput, type IcLineInput } from "../slices/ic/services/create-ic-transaction.js";
export { settleIcDocuments, type SettleIcDocumentsInput } from "../slices/ic/services/settle-ic-documents.js";

// ─── Hub services ───────────────────────────────────────────────────────────
export { getBudgetVariance, type GetBudgetVarianceInput } from "../slices/hub/services/get-budget-variance.js";

// ─── Reporting services ─────────────────────────────────────────────────────
export { getBalanceSheet, type GetBalanceSheetInput } from "../slices/reporting/services/get-balance-sheet.js";
export { getIncomeStatement, type GetIncomeStatementInput } from "../slices/reporting/services/get-income-statement.js";
export { getCashFlow, type GetCashFlowInput } from "../slices/reporting/services/get-cash-flow.js";
