/**
 * @afenda/finance — Public API surface.
 *
 * This is the ONLY entrypoint consumers should import from.
 */

// ─── Domain types (via domain/index.ts shim) ────────────────────────────────
export type { Journal, JournalLine, Account, AccountType, FiscalPeriod, PeriodStatus } from "./domain/index.js";
export type { Ledger } from "./domain/index.js";
export type { FxRate } from "./domain/index.js";
export { convertAmount } from "./domain/index.js";
export type { GlBalance, TrialBalanceRow, TrialBalance } from "./domain/index.js";
export type { JournalAuditEntry } from "./domain/index.js";
export type { IntercompanyRelationship, IntercompanyDocument } from "./domain/index.js";
export type { RecurringTemplate, RecurringTemplateLine, RecurringFrequency } from "./domain/index.js";
export type { BudgetEntry, BudgetVarianceRow, BudgetVarianceReport } from "./domain/index.js";
export type { BalanceSheet, IncomeStatement, CashFlowStatement, ReportSection, ReportRow } from "./domain/index.js";

// ─── GL ports ───────────────────────────────────────────────────────────────
export type { IJournalRepo, CreateJournalInput } from "./slices/gl/ports/journal-repo.js";
export type { IAccountRepo } from "./slices/gl/ports/account-repo.js";
export type { IFiscalPeriodRepo } from "./slices/gl/ports/fiscal-period-repo.js";
export type { IGlBalanceRepo } from "./slices/gl/ports/gl-balance-repo.js";
export type { IJournalAuditRepo, AuditLogInput } from "./slices/gl/ports/journal-audit-repo.js";
export type { ILedgerRepo } from "./slices/gl/ports/ledger-repo.js";
export type { IDocumentNumberGenerator } from "./slices/gl/ports/document-number-generator.js";

// ─── Shared ports ───────────────────────────────────────────────────────────
export type { IIdempotencyStore, IdempotencyClaimInput, IdempotencyResult } from "./shared/ports/idempotency-store.js";
export type { IOutboxWriter, OutboxEvent } from "./shared/ports/outbox-writer.js";
export type { IAuthorizationPolicy, FinancePermission, SoDViolation } from "./shared/ports/authorization.js";

// ─── Finance runtime + per-slice deps ────────────────────────────────────────
export type { FinanceRuntime, FinanceDeps, GlDeps, FxDeps, IcDeps, HubDeps, SharedDeps } from "./app/ports/finance-runtime.js";

// ─── FX ports ───────────────────────────────────────────────────────────────
export type { IFxRateRepo } from "./slices/fx/ports/fx-rate-repo.js";

// ─── IC ports ───────────────────────────────────────────────────────────────
export type { IIcAgreementRepo, IIcTransactionRepo, CreateIcDocumentInput } from "./slices/ic/ports/ic-repo.js";

// ─── Hub ports ──────────────────────────────────────────────────────────────
export type { IRecurringTemplateRepo, CreateRecurringTemplateInput } from "./slices/hub/ports/recurring-template-repo.js";
export type { IBudgetRepo, UpsertBudgetEntryInput } from "./slices/hub/ports/budget-repo.js";

// ─── GL services ────────────────────────────────────────────────────────────
export { postJournal, type PostJournalInput } from "./slices/gl/services/post-journal.js";
export { createJournal, type CreateJournalRequest } from "./slices/gl/services/create-journal.js";
export { getJournal } from "./slices/gl/services/get-journal.js";
export { reverseJournal, type ReverseJournalInput } from "./slices/gl/services/reverse-journal.js";
export { voidJournal } from "./slices/gl/services/void-journal.js";
export { getTrialBalance, type GetTrialBalanceInput } from "./slices/gl/services/get-trial-balance.js";
export { closePeriod } from "./slices/gl/services/close-period.js";
export { lockPeriod } from "./slices/gl/services/lock-period.js";
export { reopenPeriod } from "./slices/gl/services/reopen-period.js";
export { closeYear, type CloseYearInput, type CloseYearResult, type CloseEvidenceItem } from "./slices/gl/services/close-year.js";
export { processRecurringJournals, type ProcessRecurringInput, type ProcessRecurringResult } from "./slices/gl/services/process-recurring-journals.js";

// ─── IC services ────────────────────────────────────────────────────────────
export { createIcTransaction, type CreateIcTransactionInput, type IcLineInput } from "./slices/ic/services/create-ic-transaction.js";

// ─── Hub services ───────────────────────────────────────────────────────────
export { getBudgetVariance, type GetBudgetVarianceInput } from "./slices/hub/services/get-budget-variance.js";
export { recognizeRevenue, type RecognizeRevenueInput, type RecognizeRevenueResult } from "./slices/hub/services/recognize-revenue.js";

// ─── Reporting services ─────────────────────────────────────────────────────
export { getBalanceSheet, type GetBalanceSheetInput } from "./slices/reporting/services/get-balance-sheet.js";
export { getIncomeStatement, type GetIncomeStatementInput } from "./slices/reporting/services/get-income-statement.js";
export { getComparativeBalanceSheet, type GetComparativeBalanceSheetInput } from "./slices/reporting/services/get-comparative-balance-sheet.js";
export { getComparativeIncomeStatement, type GetComparativeIncomeStatementInput } from "./slices/reporting/services/get-comparative-income-statement.js";

// OBS-01: Infra adapters moved to "@afenda/finance/infra" subpath.
// Import from "@afenda/finance/infra" for Drizzle repos, route registrars, and runtime.

// ─── Shared ─────────────────────────────────────────────────────────────────
export { FinanceEventType } from "./shared/events.js";
