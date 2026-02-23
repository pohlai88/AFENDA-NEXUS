/**
 * @afenda/finance — Public API surface.
 *
 * This is the ONLY entrypoint consumers should import from.
 */

// Domain types
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

// App layer — ports
export type { IJournalRepo, CreateJournalInput } from "./app/ports/journal-repo.js";
export type { IAccountRepo } from "./app/ports/account-repo.js";
export type { IFiscalPeriodRepo } from "./app/ports/fiscal-period-repo.js";
export type { IGlBalanceRepo } from "./app/ports/gl-balance-repo.js";
export type { IIdempotencyStore, IdempotencyClaimInput, IdempotencyResult } from "./app/ports/idempotency-store.js";
export type { IOutboxWriter, OutboxEvent } from "./app/ports/outbox-writer.js";
export type { FinanceRuntime, FinanceDeps } from "./app/ports/finance-runtime.js";
export type { IJournalAuditRepo, AuditLogInput } from "./app/ports/journal-audit-repo.js";
export type { IFxRateRepo } from "./app/ports/fx-rate-repo.js";
export type { ILedgerRepo } from "./app/ports/ledger-repo.js";
export type { IIcAgreementRepo, IIcTransactionRepo, CreateIcDocumentInput } from "./app/ports/ic-repo.js";
export type { IRecurringTemplateRepo, CreateRecurringTemplateInput } from "./app/ports/recurring-template-repo.js";
export type { IBudgetRepo, UpsertBudgetEntryInput } from "./app/ports/budget-repo.js";
export type { IDocumentNumberGenerator } from "./app/ports/document-number-generator.js";
export type { IAuthorizationPolicy, FinancePermission, SoDViolation } from "./app/ports/authorization.js";

// App layer — services
export { postJournal, type PostJournalInput } from "./app/services/post-journal.js";
export { createJournal, type CreateJournalRequest } from "./app/services/create-journal.js";
export { getJournal } from "./app/services/get-journal.js";
export { reverseJournal, type ReverseJournalInput } from "./app/services/reverse-journal.js";
export { voidJournal } from "./app/services/void-journal.js";
export { getTrialBalance, type GetTrialBalanceInput } from "./app/services/get-trial-balance.js";
export { closePeriod } from "./app/services/close-period.js";
export { lockPeriod } from "./app/services/lock-period.js";
export { reopenPeriod } from "./app/services/reopen-period.js";
export { createIcTransaction, type CreateIcTransactionInput, type IcLineInput } from "./app/services/create-ic-transaction.js";
export { processRecurringJournals, type ProcessRecurringInput, type ProcessRecurringResult } from "./app/services/process-recurring-journals.js";
export { getBudgetVariance, type GetBudgetVarianceInput } from "./app/services/get-budget-variance.js";
export { getBalanceSheet, type GetBalanceSheetInput } from "./app/services/get-balance-sheet.js";
export { getIncomeStatement, type GetIncomeStatementInput } from "./app/services/get-income-statement.js";
export { getComparativeBalanceSheet, type GetComparativeBalanceSheetInput } from "./app/services/get-comparative-balance-sheet.js";
export { getComparativeIncomeStatement, type GetComparativeIncomeStatementInput } from "./app/services/get-comparative-income-statement.js";
export { closeYear, type CloseYearInput, type CloseYearResult, type CloseEvidenceItem } from "./app/services/close-year.js";
export { recognizeRevenue, type RecognizeRevenueInput, type RecognizeRevenueResult } from "./app/services/recognize-revenue.js";

// OBS-01: Infra adapters moved to "@afenda/finance/infra" subpath.
// Import from "@afenda/finance/infra" for Drizzle repos, route registrars, and runtime.

// Domain event type registry
export { FinanceEventType } from "./domain/events.js";
