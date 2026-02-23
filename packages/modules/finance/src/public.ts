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
export type { FinanceRuntime, FinanceDeps, GlDeps, FxDeps, IcDeps, HubDeps, ApDeps, ArDeps, TaxDeps, FaDeps, BankDeps, CreditDeps, SharedDeps } from "./app/ports/finance-runtime.js";

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

// ─── AP ports ──────────────────────────────────────────────────────────────
export type { IApInvoiceRepo, CreateApInvoiceInput } from "./slices/ap/ports/ap-invoice-repo.js";
export type { IPaymentTermsRepo } from "./slices/ap/ports/payment-terms-repo.js";
export type { IApPaymentRunRepo, CreatePaymentRunInput, AddPaymentRunItemInput } from "./slices/ap/ports/payment-run-repo.js";

// ─── AP entities ───────────────────────────────────────────────────────────
export type { ApInvoice, ApInvoiceLine, ApInvoiceStatus } from "./slices/ap/entities/ap-invoice.js";
export type { PaymentTerms } from "./slices/ap/entities/payment-terms.js";
export type { PaymentRun, PaymentRunItem, PaymentRunStatus } from "./slices/ap/entities/payment-run.js";

// ─── AP services ───────────────────────────────────────────────────────────
export { postApInvoice, type PostApInvoiceInput } from "./slices/ap/services/post-ap-invoice.js";
export { executePaymentRun, type ExecutePaymentRunInput } from "./slices/ap/services/execute-payment-run.js";
export { createDebitMemo, type CreateDebitMemoInput } from "./slices/ap/services/create-debit-memo.js";
export { getApAging, type GetApAgingInput } from "./slices/ap/services/get-ap-aging.js";

// ─── AP calculators ────────────────────────────────────────────────────────
export { threeWayMatch, type MatchInput, type MatchResult } from "./slices/ap/calculators/three-way-match.js";
export { computeApAging, type AgingReport, type AgingBucket, type SupplierAgingRow } from "./slices/ap/calculators/ap-aging.js";
export { computeEarlyPaymentDiscount, type DiscountResult } from "./slices/ap/calculators/early-payment-discount.js";
export { buildPain001, type PaymentInstruction, type Pain001Output } from "./slices/ap/calculators/payment-file-builder.js";
export { computeWht, type WhtRate, type WhtResult } from "./slices/ap/calculators/wht-calculator.js";
export { detectDuplicates, type InvoiceFingerprint, type DuplicateGroup } from "./slices/ap/calculators/duplicate-detection.js";
export { computeAccruedLiabilities, type UninvoicedReceipt, type AccrualEntry } from "./slices/ap/calculators/accrued-liabilities.js";
export { reconcileSupplierStatement, type SupplierStatementLine, type ApLedgerEntry, type ReconMatch, type ReconResult } from "./slices/ap/calculators/supplier-statement-recon.js";

// ─── AP route registrars ───────────────────────────────────────────────────
export { registerApInvoiceRoutes } from "./slices/ap/routes/ap-invoice-routes.js";
export { registerApPaymentRunRoutes } from "./slices/ap/routes/ap-payment-run-routes.js";
export { registerApAgingRoutes } from "./slices/ap/routes/ap-aging-routes.js";

// ─── AR ports ──────────────────────────────────────────────────────────────
export type { IArInvoiceRepo, CreateArInvoiceInput as CreateArInvoiceRepoInput } from "./slices/ar/ports/ar-invoice-repo.js";
export type { IArPaymentAllocationRepo, CreatePaymentAllocationInput, AddAllocationItemInput } from "./slices/ar/ports/ar-payment-allocation-repo.js";
export type { IDunningRepo, CreateDunningRunInput, AddDunningLetterInput } from "./slices/ar/ports/dunning-repo.js";

// ─── AR entities ───────────────────────────────────────────────────────────
export type { ArInvoice, ArInvoiceLine, ArInvoiceStatus } from "./slices/ar/entities/ar-invoice.js";
export type { ArPaymentAllocation, AllocationItem, AllocationMethod } from "./slices/ar/entities/ar-payment-allocation.js";
export type { DunningRun, DunningLetter, DunningRunStatus, DunningLevel } from "./slices/ar/entities/dunning.js";

// ─── AR services ───────────────────────────────────────────────────────────
export { postArInvoice, type PostArInvoiceInput } from "./slices/ar/services/post-ar-invoice.js";
export { allocatePayment, type AllocatePaymentInput } from "./slices/ar/services/allocate-payment.js";
export { writeOffInvoice, type WriteOffInvoiceInput } from "./slices/ar/services/write-off-invoice.js";
export { createCreditNote, type CreateCreditNoteInput } from "./slices/ar/services/create-credit-note.js";
export { getArAging, type GetArAgingInput } from "./slices/ar/services/get-ar-aging.js";
export { runDunning, type RunDunningInput } from "./slices/ar/services/run-dunning.js";

// ─── AR calculators ────────────────────────────────────────────────────────
export { computeArAging, type ArAgingReport, type ArAgingRow } from "./slices/ar/calculators/ar-aging.js";
export { computeLateFee, computeLateFees, type LateFeeInput, type LateFeeResult } from "./slices/ar/calculators/late-fee.js";
export { computeDunningScore, computeDunningScores, computeDunningLevel } from "./slices/ar/calculators/dunning-score.js";
export { computeEclProvision, DEFAULT_ECL_MATRIX, type EclInput, type EclResult } from "./slices/ar/calculators/ecl-provision.js";
export { allocatePaymentFifo, allocatePaymentSpecific, type AllocationResult } from "./slices/ar/calculators/payment-allocation.js";
export { checkCreditLimit, type CreditLimitInput, type CreditLimitResult } from "./slices/ar/calculators/credit-limit.js";
export { matchIcReceivables, type IcReceivable, type IcPayable, type IcMatchResult, type IcMatchingSummary } from "./slices/ar/calculators/ic-receivable-matching.js";
export { computeInvoiceDiscounting, computeBatchDiscounting, type FactoringInput, type FactoringResult } from "./slices/ar/calculators/invoice-discounting.js";
export { computeRevenueRecognition, computeBatchRevenueRecognition, type RevenueRecognitionInput, type RevenueRecognitionResult, type RecognitionMethod } from "./slices/ar/calculators/revenue-recognition-hook.js";

// ─── AR route registrars ───────────────────────────────────────────────────
export { registerArInvoiceRoutes } from "./slices/ar/routes/ar-invoice-routes.js";
export { registerArPaymentRoutes } from "./slices/ar/routes/ar-payment-routes.js";
export { registerArAgingRoutes } from "./slices/ar/routes/ar-aging-routes.js";
export { registerArDunningRoutes } from "./slices/ar/routes/ar-dunning-routes.js";

// ─── Tax ports ─────────────────────────────────────────────────────────────
export type { ITaxRateRepo, CreateTaxRateInput } from "./slices/tax/ports/tax-rate-repo.js";
export type { ITaxCodeRepo, CreateTaxCodeInput as CreateTaxCodeRepoInput } from "./slices/tax/ports/tax-code-repo.js";
export type { ITaxReturnRepo, CreateTaxReturnInput } from "./slices/tax/ports/tax-return-repo.js";
export type { IWhtCertificateRepo, CreateWhtCertificateInput } from "./slices/tax/ports/wht-certificate-repo.js";

// ─── Tax entities ──────────────────────────────────────────────────────────
export type { TaxRate, TaxRateType } from "./slices/tax/entities/tax-rate.js";
export type { TaxCode, JurisdictionLevel } from "./slices/tax/entities/tax-code.js";
export type { TaxReturnPeriod, TaxReturnStatus } from "./slices/tax/entities/tax-return.js";
export type { WhtCertificate, WhtCertificateStatus } from "./slices/tax/entities/wht-certificate.js";

// ─── Tax services ──────────────────────────────────────────────────────────
export { aggregateTaxReturn, type AggregateTaxReturnInput } from "./slices/tax/services/aggregate-tax-return.js";
export { issueWhtCertificate, type IssueWhtCertificateInput } from "./slices/tax/services/issue-wht-certificate.js";

// ─── Tax calculators ───────────────────────────────────────────────────────
export { lookupTaxCode, computeCompoundTax, type TaxLookupAddress, type TaxLookupResult, type CompoundTaxResult } from "./slices/tax/calculators/tax-code-hierarchy.js";
export { computeVatNetting, type TaxEntry, type VatNettingResult, type VatNettingSummary } from "./slices/tax/calculators/vat-netting.js";
export { buildSaftFile, validateSaftFile, type SaftFile, type SaftHeader, type SaftTransaction, type SaftValidationResult } from "./slices/tax/calculators/saft-export.js";
export { computeWhtWithTreaty, computeBatchWht, type TreatyRate, type WhtTreatyInput, type WhtTreatyResult } from "./slices/tax/calculators/wht-treaty.js";
export { computeDeferredTax, type TemporaryDifference, type DeferredTaxResult, type DeferredTaxItem } from "./slices/tax/calculators/deferred-tax.js";
export { computeTaxProvision, type TaxProvisionInput, type TaxProvisionResult } from "./slices/tax/calculators/tax-provision.js";
export { formatTaxReturn, formatMySst, formatSgGst, formatGenericVat, type FormattedTaxReturn, type TaxReturnData, type CountryFormatType } from "./slices/tax/calculators/country-formats.js";
export { validateTransferPrice, validateBatchTransferPrices, type TransferPricingInput, type TransferPricingResult, type TransferPricingMethod } from "./slices/tax/calculators/transfer-pricing.js";

// ─── Tax route registrars ──────────────────────────────────────────────────
export { registerTaxCodeRoutes } from "./slices/tax/routes/tax-code-routes.js";
export { registerTaxRateRoutes } from "./slices/tax/routes/tax-rate-routes.js";
export { registerTaxReturnRoutes } from "./slices/tax/routes/tax-return-routes.js";
export { registerWhtCertificateRoutes } from "./slices/tax/routes/wht-certificate-routes.js";

// ─── FA ports ──────────────────────────────────────────────────────────────
export type { IAssetRepo, CreateAssetInput } from "./slices/fixed-assets/ports/asset-repo.js";
export type { IDepreciationScheduleRepo, CreateDepreciationEntryInput } from "./slices/fixed-assets/ports/depreciation-schedule-repo.js";
export type { IAssetMovementRepo, CreateAssetMovementInput } from "./slices/fixed-assets/ports/asset-movement-repo.js";

// ─── FA entities ───────────────────────────────────────────────────────────
export type { Asset, AssetStatus, DepreciationMethod } from "./slices/fixed-assets/entities/asset.js";
export type { AssetComponent } from "./slices/fixed-assets/entities/asset-component.js";
export type { DepreciationScheduleEntry } from "./slices/fixed-assets/entities/depreciation-schedule.js";
export type { AssetMovement, MovementType } from "./slices/fixed-assets/entities/asset-movement.js";

// ─── FA services ───────────────────────────────────────────────────────────
export { runDepreciation, type RunDepreciationInput, type RunDepreciationResult } from "./slices/fixed-assets/services/run-depreciation.js";
export { disposeAsset, type DisposeAssetInput } from "./slices/fixed-assets/services/dispose-asset.js";

// ─── FA calculators ────────────────────────────────────────────────────────
export { computeDepreciation, computeBatchDepreciation, type DepreciationInput, type DepreciationResult } from "./slices/fixed-assets/calculators/depreciation.js";
export { splitAssetComponents, type ComponentSplit, type ComponentSplitInput, type ComponentSplitResult } from "./slices/fixed-assets/calculators/component-accounting.js";
export { computeRevaluation, type RevaluationInput, type RevaluationResult, type RevaluationEffect } from "./slices/fixed-assets/calculators/revaluation.js";
export { computeImpairment, type ImpairmentInput, type ImpairmentResult } from "./slices/fixed-assets/calculators/impairment.js";
export { computeDisposal, type DisposalInput, type DisposalResult } from "./slices/fixed-assets/calculators/disposal.js";

// ─── FA route registrars ───────────────────────────────────────────────────
export { registerAssetRoutes } from "./slices/fixed-assets/routes/asset-routes.js";

// ─── Bank ports ────────────────────────────────────────────────────────────
export type { IBankStatementRepo, CreateBankStatementInput, CreateStatementLineInput } from "./slices/bank/ports/bank-statement-repo.js";
export type { IBankMatchRepo, CreateBankMatchInput } from "./slices/bank/ports/bank-match-repo.js";
export type { IBankReconciliationRepo, CreateBankReconciliationInput } from "./slices/bank/ports/bank-reconciliation-repo.js";

// ─── Bank entities ─────────────────────────────────────────────────────────
export type { BankStatement, StatementFormat } from "./slices/bank/entities/bank-statement.js";
export type { BankStatementLine, TransactionType, MatchStatus } from "./slices/bank/entities/bank-statement-line.js";
export type { BankMatch, MatchType, MatchConfidence } from "./slices/bank/entities/bank-match.js";
export type { BankReconciliation, ReconciliationStatus } from "./slices/bank/entities/bank-reconciliation.js";

// ─── Bank services ─────────────────────────────────────────────────────────
export { signOffReconciliation, type SignOffReconciliationInput } from "./slices/bank/services/sign-off-reconciliation.js";

// ─── Bank calculators ──────────────────────────────────────────────────────
export { parseOfx, parseCsv, type ParsedStatement, type ParsedStatementLine, type ParseResult } from "./slices/bank/calculators/statement-parser.js";
export { autoMatchLines, type GlCandidate, type MatchCandidate, type AutoMatchResult, type AutoMatchConfig } from "./slices/bank/calculators/auto-match.js";
export { computeOutstandingItems, type OutstandingItem, type OutstandingItemsResult } from "./slices/bank/calculators/outstanding-items.js";
export { classifyBankCharges, type ChargeRule, type ClassifiedCharge, type ChargeClassificationResult, type ChargeCategory } from "./slices/bank/calculators/bank-charges.js";
export { computeMultiCurrencyRecon, type MultiCurrencyReconInput, type MultiCurrencyReconResult, type FxRateEntry } from "./slices/bank/calculators/multi-currency-recon.js";

// ─── Bank route registrars ─────────────────────────────────────────────────
export { registerBankRoutes } from "./slices/bank/routes/bank-routes.js";

// ─── Credit ports ──────────────────────────────────────────────────────────
export type { ICreditLimitRepo, CreateCreditLimitInput } from "./slices/credit/ports/credit-limit-repo.js";
export type { ICreditReviewRepo, CreateCreditReviewInput } from "./slices/credit/ports/credit-review-repo.js";

// ─── Credit entities ───────────────────────────────────────────────────────
export type { CreditLimit, CreditStatus } from "./slices/credit/entities/credit-limit.js";
export type { CreditReview, ReviewOutcome } from "./slices/credit/entities/credit-review.js";

// ─── Credit services ───────────────────────────────────────────────────────
export { placeCreditHold, releaseCreditHold, type CreditHoldInput, type CreditReleaseInput } from "./slices/credit/services/credit-hold-release.js";

// ─── Credit calculators ────────────────────────────────────────────────────
export { checkCreditLimit as checkCmCreditLimit, type CreditCheckInput, type CreditCheckResult, type CreditDecision } from "./slices/credit/calculators/credit-check.js";
export { computeCreditExposure, type CreditExposureInput, type CreditExposureResult, type ExposureItem } from "./slices/credit/calculators/credit-exposure.js";
export { computeEcl as computeCmEcl, type EclInput as CmEclInput, type EclResult as CmEclResult, type AgingBucket as CmAgingBucket, type EclBucketResult } from "./slices/credit/calculators/ecl-calculator.js";

// ─── Credit route registrars ───────────────────────────────────────────────
export { registerCreditRoutes } from "./slices/credit/routes/credit-routes.js";

// ─── Shared ─────────────────────────────────────────────────────────────────
export { FinanceEventType } from "./shared/events.js";
