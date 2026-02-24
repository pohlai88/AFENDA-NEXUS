/**
 * @afenda/finance — Public API surface.
 *
 * This is the ONLY entrypoint consumers should import from.
 */

// ─── Domain types (direct slice imports) ─────────────────────────────────────
export type { Journal, JournalLine } from "./slices/gl/entities/journal.js";
export type { Account, AccountType } from "./slices/gl/entities/account.js";
export type { FiscalPeriod, PeriodStatus } from "./slices/gl/entities/fiscal-period.js";
export type { Ledger } from "./slices/gl/entities/ledger.js";
export type { FxRate } from "./slices/fx/entities/fx-rate.js";
export { convertAmount } from "./slices/fx/entities/fx-rate.js";
export type { GlBalance, TrialBalanceRow, TrialBalance } from "./slices/gl/entities/gl-balance.js";
export type { JournalAuditEntry } from "./slices/gl/entities/journal-audit.js";
export type { IntercompanyRelationship, IntercompanyDocument } from "./slices/ic/entities/intercompany.js";
export type { RecurringTemplate, RecurringTemplateLine, RecurringFrequency } from "./slices/hub/entities/recurring-template.js";
export type { BudgetEntry, BudgetVarianceRow, BudgetVarianceReport } from "./slices/hub/entities/budget.js";
export type { BalanceSheet, IncomeStatement, CashFlowStatement, ReportSection, ReportRow } from "./slices/reporting/entities/financial-reports.js";

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
export type { FinanceRuntime, FinanceDeps, GlDeps, FxDeps, IcDeps, HubDeps, ApDeps, ArDeps, TaxDeps, FaDeps, BankDeps, CreditDeps, ExpenseDeps, ProjectDeps, SharedDeps } from "./app/ports/finance-runtime.js";

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
export { confirmManualMatch, type ManualMatchInput } from "./slices/bank/services/confirm-manual-match.js";
export { autoPostMatches, type AutoPostMatchesInput, type AutoPostResult } from "./slices/bank/services/auto-post-matches.js";
export { investigateUnmatched, type InvestigateUnmatchedInput } from "./slices/bank/services/investigate-unmatched.js";

// ─── Bank calculators ──────────────────────────────────────────────────────
export { parseOfx, parseCsv, type ParsedStatement, type ParsedStatementLine, type ParseResult } from "./slices/bank/calculators/statement-parser.js";
export { autoMatchLines, type GlCandidate, type MatchCandidate, type AutoMatchResult, type AutoMatchConfig } from "./slices/bank/calculators/auto-match.js";
export { computeOutstandingItems, type OutstandingItem, type OutstandingItemsResult } from "./slices/bank/calculators/outstanding-items.js";
export { classifyBankCharges, type ChargeRule, type ClassifiedCharge, type ChargeClassificationResult, type ChargeCategory } from "./slices/bank/calculators/bank-charges.js";
export { computeMultiCurrencyRecon, type MultiCurrencyReconInput, type MultiCurrencyReconResult, type FxRateEntry } from "./slices/bank/calculators/multi-currency-recon.js";
export { computeIntradayBalance, type IntradayTransaction, type IntradayBalancePoint, type IntradayBalanceResult } from "./slices/bank/calculators/intraday-balance.js";

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
export { writeOffBadDebt, type BadDebtWriteOffInput, type BadDebtWriteOffResult } from "./slices/credit/services/bad-debt-write-off.js";

// ─── Credit calculators ────────────────────────────────────────────────────
export { checkCreditLimit as checkCmCreditLimit, type CreditCheckInput, type CreditCheckResult, type CreditDecision } from "./slices/credit/calculators/credit-check.js";
export { computeCreditExposure, type CreditExposureInput, type CreditExposureResult, type ExposureItem } from "./slices/credit/calculators/credit-exposure.js";
export { computeEcl as computeCmEcl, type EclInput as CmEclInput, type EclResult as CmEclResult, type AgingBucket as CmAgingBucket, type EclBucketResult } from "./slices/credit/calculators/ecl-calculator.js";

// ─── Credit route registrars ───────────────────────────────────────────────
export { registerCreditRoutes } from "./slices/credit/routes/credit-routes.js";

// ─── Expense ports ────────────────────────────────────────────────────────
export type { IExpenseClaimRepo, CreateExpenseClaimInput, CreateExpenseClaimLineInput } from "./slices/expense/ports/expense-claim-repo.js";
export type { IExpensePolicyRepo, CreateExpensePolicyInput } from "./slices/expense/ports/expense-policy-repo.js";

// ─── Expense entities ─────────────────────────────────────────────────────
export type { ExpenseClaim, ClaimStatus } from "./slices/expense/entities/expense-claim.js";
export type { ExpenseClaimLine, ExpenseCategory } from "./slices/expense/entities/expense-claim-line.js";
export type { ExpensePolicy } from "./slices/expense/entities/expense-policy.js";

// ─── Expense services ─────────────────────────────────────────────────────
export { submitExpenseClaim, type SubmitExpenseClaimInput } from "./slices/expense/services/submit-expense-claim.js";
export { reimburseExpenseClaim, type ReimburseExpenseClaimInput, type ReimburseExpenseClaimResult } from "./slices/expense/services/reimburse-expense-claim.js";

// ─── Expense calculators ──────────────────────────────────────────────────
export { enforceExpensePolicy, type PolicyCheckLine, type PolicyViolation, type PolicyCheckResult } from "./slices/expense/calculators/policy-enforcement.js";
export { computePerDiem, computeMileage, type PerDiemInput, type PerDiemResult, type MileageInput, type MileageResult } from "./slices/expense/calculators/per-diem-mileage.js";
export { computeFxReimbursement, type FxReimbursementInput, type FxReimbursementResult } from "./slices/expense/calculators/fx-reimbursement.js";

// ─── Expense route registrars ─────────────────────────────────────────────
export { registerExpenseRoutes } from "./slices/expense/routes/expense-routes.js";

// ─── Project ports ────────────────────────────────────────────────────────
export type { IProjectRepo, CreateProjectInput, CreateProjectCostLineInput, CreateProjectBillingInput } from "./slices/project/ports/project-repo.js";

// ─── Project entities ─────────────────────────────────────────────────────
export type { Project, ProjectStatus, BillingType } from "./slices/project/entities/project.js";
export type { ProjectCostLine, CostCategory } from "./slices/project/entities/project-cost-line.js";
export type { ProjectBilling, BillingStatus } from "./slices/project/entities/project-billing.js";

// ─── Project services ────────────────────────────────────────────────────
export { transferWipToRevenue, type TransferWipToRevenueInput, type TransferWipToRevenueResult } from "./slices/project/services/transfer-wip-to-revenue.js";
export { billProject, type BillProjectInput } from "./slices/project/services/bill-project.js";

// ─── Project calculators ──────────────────────────────────────────────────
export { computeEarnedValue, type EarnedValueInput, type EarnedValueResult } from "./slices/project/calculators/earned-value.js";
export { computePctCompletion, type PctCompletionInput, type PctCompletionResult } from "./slices/project/calculators/pct-completion.js";
export { computeProjectProfitability, type ProfitabilityInput, type ProfitabilityResult } from "./slices/project/calculators/project-profitability.js";

// ─── Project route registrars ─────────────────────────────────────────────
export { registerProjectRoutes } from "./slices/project/routes/project-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Lease Accounting (IFRS 16)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Lease entities ──────────────────────────────────────────────────────
export type { LeaseContract, LeaseType, LeaseStatus } from "./slices/lease/entities/lease-contract.js";
export type { LeaseSchedule } from "./slices/lease/entities/lease-schedule.js";
export type { LeaseModification, ModificationType } from "./slices/lease/entities/lease-modification.js";

// ─── Lease ports ─────────────────────────────────────────────────────────
export type { ILeaseContractRepo, CreateLeaseContractInput } from "./slices/lease/ports/lease-contract-repo.js";
export type { ILeaseScheduleRepo, CreateLeaseScheduleInput } from "./slices/lease/ports/lease-schedule-repo.js";
export type { ILeaseModificationRepo, CreateLeaseModificationInput } from "./slices/lease/ports/lease-modification-repo.js";

// ─── Lease calculators ───────────────────────────────────────────────────
export { computeLeaseRecognition, type LeaseRecognitionInput, type LeaseRecognitionResult } from "./slices/lease/calculators/lease-recognition.js";
export { computeAmortizationSchedule, type AmortizationScheduleInput, type AmortizationLine, type AmortizationScheduleResult } from "./slices/lease/calculators/amortization-schedule.js";
export { computeLeaseModification, type LeaseModificationCalcInput, type LeaseModificationCalcResult } from "./slices/lease/calculators/lease-modification-calc.js";
export { checkLeaseExemptions, type LeaseExemptionInput, type LeaseExemptionResult } from "./slices/lease/calculators/lease-exemptions.js";
export { computeSaleLeaseback, type SaleLeasebackInput, type SaleLeasebackResult } from "./slices/lease/calculators/sale-leaseback.js";
export { classifyLessorLease, type LessorClassificationInput, type LessorClassificationResult, type LessorLeaseType } from "./slices/lease/calculators/lessor-classification.js";

// ─── Lease services ──────────────────────────────────────────────────────
export { modifyLease, type ModifyLeaseInput } from "./slices/lease/services/modify-lease.js";

// ─── Lease route registrars ──────────────────────────────────────────────
export { registerLeaseRoutes } from "./slices/lease/routes/lease-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Provisions (IAS 37)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Provision entities ──────────────────────────────────────────────────
export type { Provision, ProvisionType, ProvisionStatus } from "./slices/provision/entities/provision.js";
export type { ProvisionMovement, ProvisionMovementType } from "./slices/provision/entities/provision-movement.js";

// ─── Provision ports ─────────────────────────────────────────────────────
export type { IProvisionRepo, CreateProvisionInput } from "./slices/provision/ports/provision-repo.js";
export type { IProvisionMovementRepo, CreateProvisionMovementInput } from "./slices/provision/ports/provision-movement-repo.js";

// ─── Provision calculators ───────────────────────────────────────────────
export { checkRecognitionCriteria, type RecognitionCriteriaInput, type RecognitionCriteriaResult } from "./slices/provision/calculators/recognition-criteria.js";
export { computeDiscountUnwind, type DiscountUnwindInput, type DiscountUnwindResult } from "./slices/provision/calculators/discount-unwind.js";
export { computeOnerousContract, type OnerousContractInput, type OnerousContractResult } from "./slices/provision/calculators/onerous-contract.js";

// ─── Provision services ──────────────────────────────────────────────────
export { utiliseProvision, type UtiliseProvisionInput } from "./slices/provision/services/utilise-provision.js";

// ─── Provision route registrars ──────────────────────────────────────────
export { registerProvisionRoutes } from "./slices/provision/routes/provision-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Treasury & Cash Management
// ═══════════════════════════════════════════════════════════════════════════

// ─── Treasury entities ───────────────────────────────────────────────────
export type { CashForecast, ForecastType } from "./slices/treasury/entities/cash-forecast.js";
export type { Covenant, CovenantType, CovenantStatus } from "./slices/treasury/entities/covenant.js";
export type { IcLoan, IcLoanStatus } from "./slices/treasury/entities/ic-loan.js";

// ─── Treasury ports ──────────────────────────────────────────────────────
export type { ICashForecastRepo, CreateCashForecastInput } from "./slices/treasury/ports/cash-forecast-repo.js";
export type { ICovenantRepo, CreateCovenantInput } from "./slices/treasury/ports/covenant-repo.js";
export type { IIcLoanRepo, CreateIcLoanInput } from "./slices/treasury/ports/ic-loan-repo.js";

// ─── Treasury calculators ────────────────────────────────────────────────
export { computeCashFlowForecast, type ForecastItem, type ForecastPeriod, type CashFlowForecastResult } from "./slices/treasury/calculators/cash-flow-forecast.js";
export { computeCashPooling, type PoolAccount, type CashPoolingResult } from "./slices/treasury/calculators/cash-pooling.js";
export { testCovenant, type CovenantTestInput, type CovenantTestResult, type CovenantComplianceStatus } from "./slices/treasury/calculators/covenant-monitor.js";
export { computeFxExposure, type FxExposureItem, type CurrencyExposure, type FxExposureResult } from "./slices/treasury/calculators/fx-exposure.js";

// ─── Treasury route registrars ───────────────────────────────────────────
export { registerTreasuryRoutes } from "./slices/treasury/routes/treasury-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Financial Instruments (IFRS 9)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Fin-Instruments entities ────────────────────────────────────────────
export type { FinancialInstrument, InstrumentClassification, InstrumentType, FairValueLevel } from "./slices/fin-instruments/entities/financial-instrument.js";

// ─── Fin-Instruments ports ───────────────────────────────────────────────
export type { IFinInstrumentRepo, CreateFinInstrumentInput } from "./slices/fin-instruments/ports/fin-instrument-repo.js";
export type { IFairValueMeasurementRepo, FairValueMeasurement, CreateFairValueMeasurementInput } from "./slices/fin-instruments/ports/fair-value-measurement-repo.js";

// ─── Fin-Instruments calculators ─────────────────────────────────────────
export { classifyInstruments, type BusinessModel, type ClassificationInput, type ClassificationResult } from "./slices/fin-instruments/calculators/classification.js";
export { evaluateDerecognition, type DerecognitionInput, type DerecognitionOutcome, type DerecognitionResult } from "./slices/fin-instruments/calculators/derecognition.js";
export { computeEcl as computeFinEcl, type EclStage, type EclInput as FinEclInput, type EclResult as FinEclResult } from "./slices/fin-instruments/calculators/ecl.js";
export { computeEir, type EirInput, type EirResult } from "./slices/fin-instruments/calculators/effective-interest-rate.js";
export { computeFairValue, type FairValueInput, type FairValueResult } from "./slices/fin-instruments/calculators/fair-value.js";

// ─── Fin-Instruments route registrars ────────────────────────────────────
export { registerFinInstrumentRoutes } from "./slices/fin-instruments/routes/fin-instrument-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Hedge Accounting (IFRS 9)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Hedge entities ──────────────────────────────────────────────────────
export type { HedgeRelationship, HedgeType, HedgeStatus } from "./slices/hedge/entities/hedge-relationship.js";

// ─── Hedge ports ─────────────────────────────────────────────────────────
export type { IHedgeRelationshipRepo, CreateHedgeRelationshipInput } from "./slices/hedge/ports/hedge-relationship-repo.js";
export type { IHedgeEffectivenessTestRepo, HedgeEffectivenessTest, CreateHedgeEffectivenessTestInput, HedgeTestMethod, HedgeTestResult } from "./slices/hedge/ports/hedge-effectiveness-test-repo.js";

// ─── Hedge calculators ───────────────────────────────────────────────────
export { testEffectiveness, type EffectivenessMethod, type EffectivenessInput, type EffectivenessResult } from "./slices/hedge/calculators/effectiveness.js";
export { computeOciReserve, type OciReserveInput, type OciReserveResult } from "./slices/hedge/calculators/oci-reserve.js";

// ─── Hedge route registrars ─────────────────────────────────────────────
export { registerHedgeRoutes } from "./slices/hedge/routes/hedge-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Intangible Assets (IAS 38)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Intangibles entities ────────────────────────────────────────────────
export type { IntangibleAsset, IntangibleAssetStatus, AmortizationMethod, IntangibleCategory, UsefulLifeType } from "./slices/intangibles/entities/intangible-asset.js";

// ─── Intangibles ports ──────────────────────────────────────────────────
export type { IIntangibleAssetRepo, CreateIntangibleAssetInput } from "./slices/intangibles/ports/intangible-asset-repo.js";

// ─── Intangibles calculators ────────────────────────────────────────────
export { computeAmortization, type AmortizationInput, type AmortizationResult } from "./slices/intangibles/calculators/amortization.js";
export { checkRecognition, type ExpenditurePhase, type RecognitionInput, type RecognitionResult } from "./slices/intangibles/calculators/recognition.js";
export { classifySoftwareCosts, type SoftwarePhase, type SoftwareCostInput, type SoftwareCostResult } from "./slices/intangibles/calculators/software-capitalization.js";

// ─── Intangibles route registrars ───────────────────────────────────────
export { registerIntangibleRoutes } from "./slices/intangibles/routes/intangible-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Deferred Tax (IAS 12)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Deferred Tax entities ───────────────────────────────────────────────
export type { DeferredTaxItem as DeferredTaxItemEntity } from "./slices/deferred-tax/entities/deferred-tax-item.js";

// ─── Deferred Tax ports ─────────────────────────────────────────────────
export type { IDeferredTaxItemRepo, CreateDeferredTaxItemInput } from "./slices/deferred-tax/ports/deferred-tax-item-repo.js";

// ─── Deferred Tax calculators ───────────────────────────────────────────
export { identifyTemporaryDifferences, type TempDiffType, type TempDiffOrigin, type TempDiffInput, type TempDiffResult } from "./slices/deferred-tax/calculators/temporary-differences.js";
export { computeDtaDtl, type DtaInput, type DtaResult, type DtaSummary } from "./slices/deferred-tax/calculators/dta-dtl.js";
export { computeRateChangeImpact, type RateChangeInput, type RateChangeResult, type RateChangeSummary } from "./slices/deferred-tax/calculators/rate-change-impact.js";
export { computeMovementSchedule, type MovementType as DtMovementType, type MovementInput, type MovementRow, type MovementScheduleResult } from "./slices/deferred-tax/calculators/movement-schedule.js";

// ─── Deferred Tax route registrars ──────────────────────────────────────
export { registerDeferredTaxRoutes } from "./slices/deferred-tax/routes/deferred-tax-routes.js";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Transfer Pricing
// ═══════════════════════════════════════════════════════════════════════════

// ─── Transfer Pricing entities ───────────────────────────────────────────
export type { TpPolicy } from "./slices/transfer-pricing/entities/tp-policy.js";
export type { TpBenchmark, TpBenchmarkMethod } from "./slices/transfer-pricing/entities/tp-benchmark.js";

// ─── Transfer Pricing ports ─────────────────────────────────────────────
export type { ITpPolicyRepo, CreateTpPolicyInput } from "./slices/transfer-pricing/ports/tp-policy-repo.js";
export type { ITpBenchmarkRepo, CreateTpBenchmarkInput } from "./slices/transfer-pricing/ports/tp-benchmark-repo.js";

// ─── Transfer Pricing calculators ───────────────────────────────────────
export { validateTpMethod, type TpMethod, type TpMethodInput, type TpMethodResult } from "./slices/transfer-pricing/calculators/tp-methods.js";
export { computeCbcr, type CbcrEntityInput, type CbcrJurisdictionRow, type CbcrResult } from "./slices/transfer-pricing/calculators/cbcr.js";
export { testThinCapitalization, type ThinCapInput, type ThinCapResult } from "./slices/transfer-pricing/calculators/thin-capitalization.js";

// ─── Transfer Pricing route registrars ──────────────────────────────────
export { registerTransferPricingRoutes } from "./slices/transfer-pricing/routes/transfer-pricing-routes.js";

// ─── Shared ─────────────────────────────────────────────────────────────────
export { FinanceEventType } from "./shared/events.js";
