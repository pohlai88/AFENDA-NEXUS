/**
 * @afenda/finance — Public API surface.
 *
 * This is the ONLY entrypoint consumers should import from.
 */

// ─── Domain types (direct slice imports) ─────────────────────────────────────
export type { Journal, JournalLine } from './slices/gl/entities/journal.js';
export type { Account, AccountType } from './slices/gl/entities/account.js';
export type { FiscalPeriod, PeriodStatus } from './slices/gl/entities/fiscal-period.js';
export type { Ledger } from './slices/gl/entities/ledger.js';
export type { FxRate } from './slices/fx/entities/fx-rate.js';
export { convertAmount } from './slices/fx/entities/fx-rate.js';
export type {
  HyperinflationInput,
  HyperinflationResult,
  RestatedLineItem,
  HyperinflationLineItem,
  PriceIndex,
} from './slices/fx/calculators/hyperinflation-restatement.js';
export { restateForHyperinflation } from './slices/fx/calculators/hyperinflation-restatement.js';
export type {
  RedenominationInput,
  RedenominationResult,
  RedenominationBalance,
  RedenominatedBalance,
} from './slices/fx/calculators/currency-redenomination.js';
export { redenominateCurrency } from './slices/fx/calculators/currency-redenomination.js';
export type { GlBalance, TrialBalanceRow, TrialBalance } from './slices/gl/entities/gl-balance.js';
export type { JournalAuditEntry } from './slices/gl/entities/journal-audit.js';
export type {
  IntercompanyRelationship,
  IntercompanyDocument,
} from './slices/ic/entities/intercompany.js';
export type {
  IcNettingInput,
  IcNettingResult,
  IcNettingPair,
  NettedSettlement,
  IcNettingPosition,
} from './slices/ic/calculators/multilateral-netting.js';
export { computeMultilateralNetting } from './slices/ic/calculators/multilateral-netting.js';
export type {
  RecurringTemplate,
  RecurringTemplateLine,
  RecurringFrequency,
} from './slices/hub/entities/recurring-template.js';
export type {
  BudgetEntry,
  BudgetVarianceRow,
  BudgetVarianceReport,
} from './slices/hub/entities/budget.js';
export type {
  BalanceSheet,
  IncomeStatement,
  CashFlowStatement,
  EquityStatementReport,
  EquityStatementReportRow,
  ReportSection,
  ReportRow,
} from './slices/reporting/entities/financial-reports.js';
export type {
  EpsInput,
  EpsResult,
  DilutiveInstrument,
  DilutiveImpact,
} from './slices/reporting/calculators/eps-calculator.js';
export { computeEps } from './slices/reporting/calculators/eps-calculator.js';
export type {
  RatioInput,
  RatioResult,
  LiquidityRatios,
  ProfitabilityRatios,
  LeverageRatios,
  EfficiencyRatios,
} from './slices/reporting/calculators/financial-ratios.js';
export { computeFinancialRatios } from './slices/reporting/calculators/financial-ratios.js';
export type {
  GoingConcernInput,
  GoingConcernResult,
  GoingConcernConclusion,
  GoingConcernIndicator,
  CashFlowAdequacy,
  WorkingCapitalPosition,
  CovenantSummary,
} from './slices/reporting/calculators/going-concern.js';
export { assessGoingConcern } from './slices/reporting/calculators/going-concern.js';
export type {
  AuditPackageInput,
  AuditPackageResult,
  LeadScheduleItem,
  JournalListingEntry,
  RelatedPartyEntry,
  SubsequentEventEntry,
  CompletenessFlag,
} from './slices/reporting/calculators/audit-package.js';
export { generateAuditPackage } from './slices/reporting/calculators/audit-package.js';
export type {
  RetentionInput,
  RetentionResult,
  RetentionPolicy,
  RetentionRecord,
  RetentionEvaluation,
  RetentionAction,
  RetentionSummaryRow,
  EntityType as RetentionEntityType,
} from './slices/reporting/calculators/data-retention.js';
export { evaluateRetention } from './slices/reporting/calculators/data-retention.js';
export type {
  PettyCashInput,
  PettyCashResult,
  PettyCashVoucher,
  PettyCashCount,
  CategoryBreakdown,
} from './slices/reporting/calculators/petty-cash.js';
export { reconcilePettyCash } from './slices/reporting/calculators/petty-cash.js';
export type {
  DocumentAttachment,
  DocumentLink,
  DocumentTraceInput,
  DocumentTraceResult,
  DocumentCategory,
  LinkedEntityType,
  IDocumentStore,
  evaluateDocumentCompleteness,
} from './shared/ports/document-attachment.js';
export type {
  EquityMethodInput,
  EquityMethodResult,
} from './slices/consolidation/calculators/equity-method.js';
export { computeEquityMethod } from './slices/consolidation/calculators/equity-method.js';
export type {
  OpeningBalanceInput,
  OpeningBalanceResult,
  OpeningBalanceLine,
  OpeningJournalLine,
} from './slices/gl/calculators/opening-balance-import.js';
export { validateOpeningBalances } from './slices/gl/calculators/opening-balance-import.js';
export type {
  FiscalYearConfig,
  FiscalYearResult,
  GeneratedPeriod,
  PeriodPattern,
} from './slices/gl/calculators/fiscal-year-generator.js';
export { generateFiscalYear } from './slices/gl/calculators/fiscal-year-generator.js';
export {
  computeParallelLedgerAdjustments,
  type ParallelLedgerInput,
  type ParallelLedgerResult,
  type ParallelLedgerEntry,
  type LedgerMappingRule,
  type AdjustmentEntry,
  type LedgerPurpose,
} from './slices/gl/calculators/parallel-ledger.js';
export {
  computeInventoryValuation,
  type InventoryInput,
  type InventoryResult,
  type InventoryItem,
  type InventoryMovement,
  type InventoryValuationLine,
  type StockCountLine,
  type InventoryJournalLine,
  type CostingMethod,
} from './slices/gl/calculators/inventory-costing.js';

// ─── GL ports ───────────────────────────────────────────────────────────────
export type { IJournalRepo, CreateJournalInput } from './slices/gl/ports/journal-repo.js';
export type { IAccountRepo } from './slices/gl/ports/account-repo.js';
export type { IFiscalPeriodRepo } from './slices/gl/ports/fiscal-period-repo.js';
export type { IGlBalanceRepo } from './slices/gl/ports/gl-balance-repo.js';
export type { IJournalAuditRepo, AuditLogInput } from './slices/gl/ports/journal-audit-repo.js';
export type { ILedgerRepo } from './slices/gl/ports/ledger-repo.js';
export type { IDocumentNumberGenerator } from './slices/gl/ports/document-number-generator.js';

// ─── Shared ports ───────────────────────────────────────────────────────────
export type {
  IIdempotencyStore,
  IdempotencyClaimInput,
  IdempotencyResult,
} from './shared/ports/idempotency-store.js';
export type { IOutboxWriter, OutboxEvent } from './shared/ports/outbox-writer.js';
export type {
  IAuthorizationPolicy,
  FinancePermission,
  SoDViolation,
} from './shared/ports/authorization.js';
export type { IRoleResolver } from './shared/ports/role-resolver.js';
export type { ISoDActionLogRepo, SoDLogInput } from './shared/ports/sod-action-log-repo.js';
export type { SoDActionLog } from './shared/entities/sod-action-log.js';
export { FINANCE_SOD_RULES, type SoDRule } from './shared/authorization/sod-rules.js';
export { PERMISSION_MAP, type PermissionMapping } from './shared/authorization/permission-map.js';

// ─── Finance runtime + per-slice deps ────────────────────────────────────────
export type {
  FinanceRuntime,
  FinanceDeps,
  GlDeps,
  FxDeps,
  IcDeps,
  HubDeps,
  ApDeps,
  ArDeps,
  TaxDeps,
  FaDeps,
  BankDeps,
  CreditDeps,
  ExpenseDeps,
  ProjectDeps,
  SharedDeps,
} from './app/ports/finance-runtime.js';

// ─── FX ports ───────────────────────────────────────────────────────────────
export type { IFxRateRepo } from './slices/fx/ports/fx-rate-repo.js';

// ─── IC ports ───────────────────────────────────────────────────────────────
export type {
  IIcAgreementRepo,
  IIcTransactionRepo,
  CreateIcDocumentInput,
} from './slices/ic/ports/ic-repo.js';

// ─── Hub ports ──────────────────────────────────────────────────────────────
export type {
  IRecurringTemplateRepo,
  CreateRecurringTemplateInput,
} from './slices/hub/ports/recurring-template-repo.js';
export type { IBudgetRepo, UpsertBudgetEntryInput } from './slices/hub/ports/budget-repo.js';

// ─── GL services ────────────────────────────────────────────────────────────
export { postJournal, type PostJournalInput } from './slices/gl/services/post-journal.js';
export { createJournal, type CreateJournalRequest } from './slices/gl/services/create-journal.js';
export { getJournal } from './slices/gl/services/get-journal.js';
export { reverseJournal, type ReverseJournalInput } from './slices/gl/services/reverse-journal.js';
export { voidJournal } from './slices/gl/services/void-journal.js';
export {
  getTrialBalance,
  type GetTrialBalanceInput,
} from './slices/gl/services/get-trial-balance.js';
export { closePeriod } from './slices/gl/services/close-period.js';
export { lockPeriod } from './slices/gl/services/lock-period.js';
export { reopenPeriod } from './slices/gl/services/reopen-period.js';
export {
  closeYear,
  type CloseYearInput,
  type CloseYearResult,
  type CloseEvidenceItem,
} from './slices/gl/services/close-year.js';
export {
  processRecurringJournals,
  type ProcessRecurringInput,
  type ProcessRecurringResult,
} from './slices/gl/services/process-recurring-journals.js';

// ─── IC services ────────────────────────────────────────────────────────────
export {
  createIcTransaction,
  type CreateIcTransactionInput,
  type IcLineInput,
} from './slices/ic/services/create-ic-transaction.js';

// ─── Hub services ───────────────────────────────────────────────────────────
export {
  getBudgetVariance,
  type GetBudgetVarianceInput,
} from './slices/hub/services/get-budget-variance.js';
export {
  recognizeRevenue,
  type RecognizeRevenueInput,
  type RecognizeRevenueResult,
} from './slices/hub/services/recognize-revenue.js';

// ─── Reporting services ─────────────────────────────────────────────────────
export {
  getBalanceSheet,
  type GetBalanceSheetInput,
} from './slices/reporting/services/get-balance-sheet.js';
export {
  getIncomeStatement,
  type GetIncomeStatementInput,
} from './slices/reporting/services/get-income-statement.js';
export {
  getComparativeBalanceSheet,
  type GetComparativeBalanceSheetInput,
} from './slices/reporting/services/get-comparative-balance-sheet.js';
export {
  getComparativeIncomeStatement,
  type GetComparativeIncomeStatementInput,
} from './slices/reporting/services/get-comparative-income-statement.js';

// OBS-01: Infra adapters moved to "@afenda/finance/infra" subpath.
// Import from "@afenda/finance/infra" for Drizzle repos, route registrars, and runtime.

// ─── AP ports ──────────────────────────────────────────────────────────────
export type { IApInvoiceRepo, CreateApInvoiceInput } from './slices/ap/ports/ap-invoice-repo.js';
export type { IPaymentTermsRepo } from './slices/ap/ports/payment-terms-repo.js';
export type {
  IApPaymentRunRepo,
  CreatePaymentRunInput,
  AddPaymentRunItemInput,
} from './slices/ap/ports/payment-run-repo.js';

// ─── AP entities ───────────────────────────────────────────────────────────
export type { ApInvoice, ApInvoiceLine, ApInvoiceStatus } from './slices/ap/entities/ap-invoice.js';
export type { PaymentTerms } from './slices/ap/entities/payment-terms.js';
export type {
  PaymentRun,
  PaymentRunItem,
  PaymentRunStatus,
} from './slices/ap/entities/payment-run.js';

// ─── AP services ───────────────────────────────────────────────────────────
export { postApInvoice, type PostApInvoiceInput } from './slices/ap/services/post-ap-invoice.js';
export {
  executePaymentRun,
  type ExecutePaymentRunInput,
} from './slices/ap/services/execute-payment-run.js';
export {
  createDebitMemo,
  type CreateDebitMemoInput,
} from './slices/ap/services/create-debit-memo.js';
export { getApAging, type GetApAgingInput } from './slices/ap/services/get-ap-aging.js';

// ─── AP calculators ────────────────────────────────────────────────────────
export {
  threeWayMatch,
  type MatchInput,
  type MatchResult,
} from './slices/ap/calculators/three-way-match.js';
export {
  computeApAging,
  type AgingReport,
  type AgingBucket,
  type SupplierAgingRow,
} from './slices/ap/calculators/ap-aging.js';
export {
  computeEarlyPaymentDiscount,
  type DiscountResult,
} from './slices/ap/calculators/early-payment-discount.js';
export {
  buildPain001,
  type PaymentInstruction,
  type Pain001Output,
} from './slices/ap/calculators/payment-file-builder.js';
export {
  buildSwiftMt101,
  buildDuitNow,
  buildSgFast,
  buildIdRtgs,
  buildThPromptPay,
  type LocalPaymentInstruction,
  type PaymentFormat,
  type PaymentFileOutput,
} from './slices/ap/calculators/local-payment-formats.js';
export {
  computeWht,
  type WhtRate,
  type WhtResult,
} from './slices/ap/calculators/wht-calculator.js';
export {
  detectDuplicates,
  type InvoiceFingerprint,
  type DuplicateGroup,
} from './slices/ap/calculators/duplicate-detection.js';
export {
  computeAccruedLiabilities,
  type UninvoicedReceipt,
  type AccrualEntry,
} from './slices/ap/calculators/accrued-liabilities.js';
export {
  reconcileSupplierStatement,
  type SupplierStatementLine,
  type ApLedgerEntry,
  type ReconMatch,
  type ReconResult,
} from './slices/ap/calculators/supplier-statement-recon.js';

// ─── Supplier entities & ports ────────────────────────────────────────────
export type {
  Supplier,
  SupplierSite,
  SupplierBankAccount,
  SupplierStatus,
  PaymentMethodType,
} from './slices/ap/entities/supplier.js';
export type {
  ISupplierRepo,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateSupplierSiteInput,
  CreateSupplierBankAccountInput,
} from './slices/ap/ports/supplier-repo.js';

// ─── AP Hold entities, ports & services ───────────────────────────────────
export type { ApHold, ApHoldType, ApHoldStatus } from './slices/ap/entities/ap-hold.js';
export type {
  IApHoldRepo,
  CreateApHoldInput,
  ReleaseApHoldInput,
} from './slices/ap/ports/ap-hold-repo.js';
export { applyHold, type ApplyHoldInput } from './slices/ap/services/apply-hold.js';
export { releaseHold, type ReleaseHoldInput } from './slices/ap/services/release-hold.js';
export {
  validateInvoice,
  type ValidateInvoiceInput,
  type ValidationResult,
} from './slices/ap/services/validate-invoice.js';
export {
  reversePaymentRun,
  type ReversePaymentRunInput,
  type PaymentReversalResult,
} from './slices/ap/services/reverse-payment-run.js';

// ─── AP services (W2) ─────────────────────────────────────────────────────
export {
  computePeriodAccruals,
  type ComputePeriodAccrualsInput,
  type PeriodAccrualResult,
} from './slices/ap/services/compute-period-accruals.js';
export type { ClearingTrace } from './slices/ap/entities/clearing-trace.js';

// ─── AP error codes ───────────────────────────────────────────────────────
export { ApErrorCode } from './slices/ap/ap-error-codes.js';
export type { ApErrorCode as ApErrorCodeType } from './slices/ap/ap-error-codes.js';

// ─── AP route registrars ───────────────────────────────────────────────────
export { registerApInvoiceRoutes } from './slices/ap/routes/ap-invoice-routes.js';
export { registerApPaymentRunRoutes } from './slices/ap/routes/ap-payment-run-routes.js';
export { registerApAgingRoutes } from './slices/ap/routes/ap-aging-routes.js';
export { registerSupplierRoutes } from './slices/ap/routes/supplier-routes.js';
export { registerApHoldRoutes } from './slices/ap/routes/ap-hold-routes.js';
export { registerApSupplierReconRoutes } from './slices/ap/routes/ap-supplier-recon-routes.js';
export { registerApReportingRoutes } from './slices/ap/routes/ap-reporting-routes.js';

// ─── AP Wave 3: Proposal, Reports, Matching ──────────────────────────────
export {
  computePaymentProposal,
  type PaymentProposalInput,
  type PaymentProposal,
  type PaymentProposalGroup,
  type PaymentProposalItem,
  type PaymentProposalSummary,
  type ProposableInvoice,
  type ProposableSupplier,
} from './slices/ap/calculators/payment-proposal.js';
export {
  partialMatch,
  type PartialMatchInput,
  type PartialMatchResult,
  type LineMatchResult,
  type LineMatchStatus,
  type MatchLine,
} from './slices/ap/calculators/partial-match.js';
export {
  computeWhtReport,
  type WhtReportEntry,
  type WhtReportRow,
  type WhtReport,
} from './slices/ap/calculators/wht-report.js';
export {
  resolveMatchTolerance,
  type MatchTolerance,
  type ToleranceScope,
} from './slices/ap/entities/match-tolerance.js';
export type {
  IMatchToleranceRepo,
  CreateMatchToleranceInput,
  UpdateMatchToleranceInput,
} from './slices/ap/ports/match-tolerance-repo.js';
export {
  computeApPeriodCloseChecklist,
  type ApPeriodCloseChecklistInput,
  type ApPeriodCloseChecklist,
  type ApCloseException,
} from './slices/ap/services/ap-period-close-checklist.js';
export {
  getPaymentRunReport,
  type PaymentRunReportInput,
  type PaymentRunReport,
  type PaymentRunSupplierBreakdown,
} from './slices/ap/services/get-payment-run-report.js';
export {
  getInvoiceAuditTimeline,
  type InvoiceAuditTimelineInput,
  type InvoiceAuditTimeline,
  type AuditTimelineEvent,
} from './slices/ap/services/get-invoice-audit-timeline.js';
export type { ITransactionScope } from './shared/ports/transaction-scope.js';

// ─── AP Wave 4: Capture, Integration & Feedback ──────────────────────────
export type { ApInvoiceType } from './slices/ap/entities/ap-invoice.js';
export {
  createCreditMemo,
  type CreateCreditMemoInput,
} from './slices/ap/services/create-credit-memo.js';
export type {
  ApPrepayment,
  ApPrepaymentStatus,
  PrepaymentApplication,
} from './slices/ap/entities/prepayment.js';
export type {
  IApPrepaymentRepo,
  CreatePrepaymentInput as CreatePrepaymentRepoInput,
  ApplyPrepaymentInput as ApplyPrepaymentRepoInput,
} from './slices/ap/ports/prepayment-repo.js';
export {
  applyPrepayment,
  type ApplyPrepaymentInput,
} from './slices/ap/services/apply-prepayment.js';
export {
  batchInvoiceImport,
  type BatchInvoiceImportInput,
  type BatchImportResult,
  type BatchRowResult,
  type BatchInvoiceRow,
} from './slices/ap/services/batch-invoice-import.js';
export type {
  InvoiceAttachment,
  IInvoiceAttachmentRepo,
  CreateAttachmentInput,
} from './slices/ap/entities/invoice-attachment.js';
export {
  processBankRejection,
  type BankRejectionInput,
  type BankRejectionResult,
} from './slices/ap/services/process-bank-rejection.js';
export {
  generateRemittanceAdvice,
  type GenerateRemittanceAdviceInput,
  type RemittanceAdvice,
  type SupplierRemittance,
  type RemittanceLineItem,
} from './slices/ap/services/generate-remittance-advice.js';
export type {
  WhtCertificate as ApWhtCertificate,
  WhtCertificateType as ApWhtCertificateType,
  WhtExemption,
} from './slices/ap/entities/wht-certificate.js';
export type {
  IWhtCertificateRepo as IApWhtCertificateRepo,
  CreateWhtCertificateInput as CreateApWhtCertificateInput,
  CreateWhtExemptionInput,
} from './slices/ap/ports/wht-certificate-repo.js';
export { registerApCaptureRoutes } from './slices/ap/routes/ap-capture-routes.js';

// ─── Supplier Portal services (N1–N6) ────────────────────────────────────
export {
  getSupplierInvoices,
  getSupplierAging,
  getSupplierPaymentRunReport,
  type GetSupplierInvoicesInput,
  type GetSupplierAgingInput,
  type GetSupplierPaymentRunInput,
} from './slices/ap/services/supplier-portal-visibility.js';
export {
  supplierAddBankAccount,
  type SupplierAddBankAccountInput,
} from './slices/ap/services/supplier-portal-bank-account.js';
export {
  supplierDownloadRemittance,
  type SupplierRemittanceDownloadInput,
  type SupplierRemittanceAdvice,
} from './slices/ap/services/supplier-portal-remittance.js';
export {
  getSupplierWhtCertificates,
  getSupplierWhtCertificateById,
  type GetSupplierWhtCertificatesInput,
  type GetSupplierWhtCertificateByIdInput,
} from './slices/ap/services/supplier-portal-wht.js';
export {
  supplierSubmitInvoices,
  type SupplierInvoiceSubmitInput,
  type SupplierInvoiceRow,
} from './slices/ap/services/supplier-portal-invoice-submit.js';
export {
  supplierUpdateProfile,
  type SupplierProfileUpdateInput,
} from './slices/ap/services/supplier-portal-profile.js';
export {
  supplierStatementRecon,
  type SupplierStatementReconInput,
  type SupplierStatementLineInput,
} from './slices/ap/services/supplier-portal-statement-recon.js';
export {
  supplierUploadDocument,
  supplierListDocuments,
  supplierVerifyDocumentIntegrity,
  type SupplierDocument,
  type SupplierDocumentUploadInput,
  type SupplierDocumentListInput,
  type SupplierDocumentCategory,
  type ISupplierDocumentRepo,
} from './slices/ap/services/supplier-portal-document-vault.js';
export {
  supplierCreateDispute,
  supplierListDisputes,
  supplierGetDisputeById,
  type SupplierDispute,
  type CreateDisputeInput,
  type ListDisputesInput,
  type GetDisputeByIdInput,
  type DisputeStatus,
  type DisputeCategory,
  type ISupplierDisputeRepo,
} from './slices/ap/services/supplier-portal-dispute.js';
export {
  supplierGetNotificationPrefs,
  supplierUpdateNotificationPrefs,
  type SupplierNotificationPref,
  type NotificationChannel,
  type NotificationEventType,
  type ISupplierNotificationPrefRepo,
} from './slices/ap/services/supplier-portal-notifications.js';
export {
  supplierGetComplianceSummary,
  type SupplierComplianceItem,
  type SupplierComplianceSummary,
  type ComplianceItemType,
  type ComplianceStatus,
  type ISupplierComplianceRepo,
} from './slices/ap/services/supplier-portal-compliance.js';
export {
  resolveSupplierIdentity,
  type SupplierIdentityInput,
  type SupplierIdentityResult,
} from './slices/ap/services/supplier-portal-identity.js';
export { registerSupplierPortalRoutes } from './slices/ap/routes/supplier-portal-routes.js';

// ─── B2: Triage queue ──────────────────────────────────────────────────────
export {
  markInvoiceIncomplete,
  assignTriageInvoice,
  resolveTriageInvoice,
  listTriageQueue,
  type TriageAssignment,
  type ITriageAssignmentRepo,
  type MarkIncompleteInput,
  type AssignTriageInput,
  type ResolveTriageInput,
  type TriageQueueQuery,
} from './slices/ap/services/ap-triage-queue.js';

// ─── B3: OCR/Automation pipeline ───────────────────────────────────────────
export {
  processOcrInvoice,
  type OcrInvoicePayload,
  type OcrInvoiceLine,
  type OcrInvoiceResult,
  type OcrConfidence,
} from './slices/ap/services/ap-ocr-pipeline.js';

// ─── K4: Tamper-resistant outbox ────────────────────────────────────────────
export {
  TamperResistantOutboxWriter,
  computeContentHash,
  verifyEntryIntegrity,
  verifyOutboxChain,
  type HashedOutboxEntry,
  type IHashedOutboxStore,
  type ChainVerificationResult,
} from './shared/services/tamper-resistant-outbox.js';

// ─── F2: WHT Income Type ───────────────────────────────────────────────────
export type { WhtIncomeType } from './slices/ap/entities/ap-invoice.js';

// ─── AR ports ──────────────────────────────────────────────────────────────
export type {
  IArInvoiceRepo,
  CreateArInvoiceInput as CreateArInvoiceRepoInput,
} from './slices/ar/ports/ar-invoice-repo.js';
export type {
  IArPaymentAllocationRepo,
  CreatePaymentAllocationInput,
  AddAllocationItemInput,
} from './slices/ar/ports/ar-payment-allocation-repo.js';
export type {
  IDunningRepo,
  CreateDunningRunInput,
  AddDunningLetterInput,
} from './slices/ar/ports/dunning-repo.js';

// ─── AR entities ───────────────────────────────────────────────────────────
export type { ArInvoice, ArInvoiceLine, ArInvoiceStatus } from './slices/ar/entities/ar-invoice.js';
export type {
  ArPaymentAllocation,
  AllocationItem,
  AllocationMethod,
} from './slices/ar/entities/ar-payment-allocation.js';
export type {
  DunningRun,
  DunningLetter,
  DunningRunStatus,
  DunningLevel,
} from './slices/ar/entities/dunning.js';

// ─── AR services ───────────────────────────────────────────────────────────
export { postArInvoice, type PostArInvoiceInput } from './slices/ar/services/post-ar-invoice.js';
export {
  allocatePayment,
  type AllocatePaymentInput,
} from './slices/ar/services/allocate-payment.js';
export {
  writeOffInvoice,
  type WriteOffInvoiceInput,
} from './slices/ar/services/write-off-invoice.js';
export {
  createCreditNote,
  type CreateCreditNoteInput,
} from './slices/ar/services/create-credit-note.js';
export { getArAging, type GetArAgingInput } from './slices/ar/services/get-ar-aging.js';
export { runDunning, type RunDunningInput } from './slices/ar/services/run-dunning.js';

// ─── AR calculators ────────────────────────────────────────────────────────
export {
  computeArAging,
  type ArAgingReport,
  type ArAgingRow,
} from './slices/ar/calculators/ar-aging.js';
export {
  computeLateFee,
  computeLateFees,
  type LateFeeInput,
  type LateFeeResult,
} from './slices/ar/calculators/late-fee.js';
export {
  computeDunningScore,
  computeDunningScores,
  computeDunningLevel,
} from './slices/ar/calculators/dunning-score.js';
export {
  computeEclProvision,
  DEFAULT_ECL_MATRIX,
  type EclInput,
  type EclResult,
} from './slices/ar/calculators/ecl-provision.js';
export {
  allocatePaymentFifo,
  allocatePaymentSpecific,
  type AllocationResult,
} from './slices/ar/calculators/payment-allocation.js';
export {
  checkCreditLimit,
  type CreditLimitInput,
  type CreditLimitResult,
} from './slices/ar/calculators/credit-limit.js';
export {
  matchIcReceivables,
  type IcReceivable,
  type IcPayable,
  type IcMatchResult,
  type IcMatchingSummary,
} from './slices/ar/calculators/ic-receivable-matching.js';
export {
  computeInvoiceDiscounting,
  computeBatchDiscounting,
  type FactoringInput,
  type FactoringResult,
} from './slices/ar/calculators/invoice-discounting.js';
export {
  computeRevenueRecognition,
  computeBatchRevenueRecognition,
  type RevenueRecognitionInput,
  type RevenueRecognitionResult,
  type RecognitionMethod,
} from './slices/ar/calculators/revenue-recognition-hook.js';

// ─── AR route registrars ───────────────────────────────────────────────────
export { registerArInvoiceRoutes } from './slices/ar/routes/ar-invoice-routes.js';
export { registerArPaymentRoutes } from './slices/ar/routes/ar-payment-routes.js';
export { registerArAgingRoutes } from './slices/ar/routes/ar-aging-routes.js';
export { registerArDunningRoutes } from './slices/ar/routes/ar-dunning-routes.js';

// ─── Tax ports ─────────────────────────────────────────────────────────────
export type { ITaxRateRepo, CreateTaxRateInput } from './slices/tax/ports/tax-rate-repo.js';
export type {
  ITaxCodeRepo,
  CreateTaxCodeInput as CreateTaxCodeRepoInput,
} from './slices/tax/ports/tax-code-repo.js';
export type { ITaxReturnRepo, CreateTaxReturnInput } from './slices/tax/ports/tax-return-repo.js';
export type {
  IWhtCertificateRepo,
  CreateWhtCertificateInput,
} from './slices/tax/ports/wht-certificate-repo.js';

// ─── Tax entities ──────────────────────────────────────────────────────────
export type { TaxRate, TaxRateType } from './slices/tax/entities/tax-rate.js';
export type { TaxCode, JurisdictionLevel } from './slices/tax/entities/tax-code.js';
export type { TaxReturnPeriod, TaxReturnStatus } from './slices/tax/entities/tax-return.js';
export type {
  WhtCertificate,
  WhtCertificateStatus,
} from './slices/tax/entities/wht-certificate.js';

// ─── Tax services ──────────────────────────────────────────────────────────
export {
  aggregateTaxReturn,
  type AggregateTaxReturnInput,
} from './slices/tax/services/aggregate-tax-return.js';
export {
  issueWhtCertificate,
  type IssueWhtCertificateInput,
} from './slices/tax/services/issue-wht-certificate.js';

// ─── Tax calculators ───────────────────────────────────────────────────────
export {
  lookupTaxCode,
  computeCompoundTax,
  type TaxLookupAddress,
  type TaxLookupResult,
  type CompoundTaxResult,
} from './slices/tax/calculators/tax-code-hierarchy.js';
export {
  computeVatNetting,
  type TaxEntry,
  type VatNettingResult,
  type VatNettingSummary,
} from './slices/tax/calculators/vat-netting.js';
export {
  buildSaftFile,
  validateSaftFile,
  type SaftFile,
  type SaftHeader,
  type SaftTransaction,
  type SaftValidationResult,
} from './slices/tax/calculators/saft-export.js';
export {
  computeWhtWithTreaty,
  computeBatchWht,
  type TreatyRate,
  type WhtTreatyInput,
  type WhtTreatyResult,
} from './slices/tax/calculators/wht-treaty.js';
export {
  computeDeferredTax,
  type TemporaryDifference,
  type DeferredTaxResult,
  type DeferredTaxItem,
} from './slices/tax/calculators/deferred-tax.js';
export {
  computeTaxProvision,
  type TaxProvisionInput,
  type TaxProvisionResult,
} from './slices/tax/calculators/tax-provision.js';
export {
  formatTaxReturn,
  formatMySst,
  formatSgGst,
  formatGenericVat,
  type FormattedTaxReturn,
  type TaxReturnData,
  type CountryFormatType,
} from './slices/tax/calculators/country-formats.js';
export {
  buildEInvoice,
  type EInvoiceInput,
  type EInvoiceResult,
  type EInvoiceFormat,
  type EInvoiceDocumentType,
  type EInvoiceParty,
  type EInvoiceLineItem,
} from './slices/tax/calculators/e-invoice-builder.js';
export {
  formatMyFormC,
  formatSgFormCs,
  formatIdPPh,
  formatThPP30,
  formatInGstr3b,
  formatUs1099Nec,
  formatEcSalesList,
  type ExtendedCountryFormat,
  type TaxFormLine,
  type TaxFormResult,
  type MyFormCInput,
  type SgFormCsInput,
  type IdPPhInput,
  type ThPP30Input,
  type InGstr3bInput,
  type Us1099NecInput,
  type Us1099NecRecipient,
  type EcSalesListInput,
  type EcSalesEntry,
} from './slices/tax/calculators/country-tax-packs.js';
export {
  computePayrollAccrual,
  type EmployeePayrollInput,
  type PayrollResult,
  type StatutoryContribution,
  type PayrollJournalLine,
  type LeaveProvision,
  type PayrollJurisdiction,
} from './slices/tax/calculators/payroll-integration.js';
export {
  validateTransferPrice,
  validateBatchTransferPrices,
  type TransferPricingInput,
  type TransferPricingResult,
  type TransferPricingMethod,
} from './slices/tax/calculators/transfer-pricing.js';

// ─── Tax route registrars ──────────────────────────────────────────────────
export { registerTaxCodeRoutes } from './slices/tax/routes/tax-code-routes.js';
export { registerTaxRateRoutes } from './slices/tax/routes/tax-rate-routes.js';
export { registerTaxReturnRoutes } from './slices/tax/routes/tax-return-routes.js';
export { registerWhtCertificateRoutes } from './slices/tax/routes/wht-certificate-routes.js';

// ─── FA ports ──────────────────────────────────────────────────────────────
export type { IAssetRepo, CreateAssetInput } from './slices/fixed-assets/ports/asset-repo.js';
export type {
  IDepreciationScheduleRepo,
  CreateDepreciationEntryInput,
} from './slices/fixed-assets/ports/depreciation-schedule-repo.js';
export type {
  IAssetMovementRepo,
  CreateAssetMovementInput,
} from './slices/fixed-assets/ports/asset-movement-repo.js';

// ─── FA entities ───────────────────────────────────────────────────────────
export type {
  Asset,
  AssetStatus,
  DepreciationMethod,
} from './slices/fixed-assets/entities/asset.js';
export type { AssetComponent } from './slices/fixed-assets/entities/asset-component.js';
export type { DepreciationScheduleEntry } from './slices/fixed-assets/entities/depreciation-schedule.js';
export type { AssetMovement, MovementType } from './slices/fixed-assets/entities/asset-movement.js';

// ─── FA services ───────────────────────────────────────────────────────────
export {
  runDepreciation,
  type RunDepreciationInput,
  type RunDepreciationResult,
} from './slices/fixed-assets/services/run-depreciation.js';
export {
  disposeAsset,
  type DisposeAssetInput,
} from './slices/fixed-assets/services/dispose-asset.js';

// ─── FA calculators ────────────────────────────────────────────────────────
export {
  computeDepreciation,
  computeBatchDepreciation,
  type DepreciationInput,
  type DepreciationResult,
} from './slices/fixed-assets/calculators/depreciation.js';
export {
  splitAssetComponents,
  type ComponentSplit,
  type ComponentSplitInput,
  type ComponentSplitResult,
} from './slices/fixed-assets/calculators/component-accounting.js';
export {
  computeRevaluation,
  type RevaluationInput,
  type RevaluationResult,
  type RevaluationEffect,
} from './slices/fixed-assets/calculators/revaluation.js';
export {
  computeImpairment,
  type ImpairmentInput,
  type ImpairmentResult,
} from './slices/fixed-assets/calculators/impairment.js';
export {
  computeDisposal,
  type DisposalInput,
  type DisposalResult,
} from './slices/fixed-assets/calculators/disposal.js';

// ─── FA route registrars ───────────────────────────────────────────────────
export { registerAssetRoutes } from './slices/fixed-assets/routes/asset-routes.js';

// ─── Bank ports ────────────────────────────────────────────────────────────
export type {
  IBankStatementRepo,
  CreateBankStatementInput,
  CreateStatementLineInput,
} from './slices/bank/ports/bank-statement-repo.js';
export type { IBankMatchRepo, CreateBankMatchInput } from './slices/bank/ports/bank-match-repo.js';
export type {
  IBankReconciliationRepo,
  CreateBankReconciliationInput,
} from './slices/bank/ports/bank-reconciliation-repo.js';

// ─── Bank entities ─────────────────────────────────────────────────────────
export type { BankStatement, StatementFormat } from './slices/bank/entities/bank-statement.js';
export type {
  BankStatementLine,
  TransactionType,
  MatchStatus,
} from './slices/bank/entities/bank-statement-line.js';
export type { BankMatch, MatchType, MatchConfidence } from './slices/bank/entities/bank-match.js';
export type {
  BankReconciliation,
  ReconciliationStatus,
} from './slices/bank/entities/bank-reconciliation.js';

// ─── Bank services ─────────────────────────────────────────────────────────
export {
  signOffReconciliation,
  type SignOffReconciliationInput,
} from './slices/bank/services/sign-off-reconciliation.js';
export {
  confirmManualMatch,
  type ManualMatchInput,
} from './slices/bank/services/confirm-manual-match.js';
export {
  autoPostMatches,
  type AutoPostMatchesInput,
  type AutoPostResult,
} from './slices/bank/services/auto-post-matches.js';
export {
  investigateUnmatched,
  type InvestigateUnmatchedInput,
} from './slices/bank/services/investigate-unmatched.js';

// ─── Bank calculators ──────────────────────────────────────────────────────
export {
  parseOfx,
  parseCsv,
  type ParsedStatement,
  type ParsedStatementLine,
  type ParseResult,
} from './slices/bank/calculators/statement-parser.js';
export {
  autoMatchLines,
  type GlCandidate,
  type MatchCandidate,
  type AutoMatchResult,
  type AutoMatchConfig,
} from './slices/bank/calculators/auto-match.js';
export {
  computeOutstandingItems,
  type OutstandingItem,
  type OutstandingItemsResult,
} from './slices/bank/calculators/outstanding-items.js';
export {
  classifyBankCharges,
  type ChargeRule,
  type ClassifiedCharge,
  type ChargeClassificationResult,
  type ChargeCategory,
} from './slices/bank/calculators/bank-charges.js';
export {
  computeMultiCurrencyRecon,
  type MultiCurrencyReconInput,
  type MultiCurrencyReconResult,
  type FxRateEntry,
} from './slices/bank/calculators/multi-currency-recon.js';
export {
  computeIntradayBalance,
  type IntradayTransaction,
  type IntradayBalancePoint,
  type IntradayBalanceResult,
} from './slices/bank/calculators/intraday-balance.js';

// ─── Bank route registrars ─────────────────────────────────────────────────
export { registerBankRoutes } from './slices/bank/routes/bank-routes.js';

// ─── Credit ports ──────────────────────────────────────────────────────────
export type {
  ICreditLimitRepo,
  CreateCreditLimitInput,
} from './slices/credit/ports/credit-limit-repo.js';
export type {
  ICreditReviewRepo,
  CreateCreditReviewInput,
} from './slices/credit/ports/credit-review-repo.js';

// ─── Credit entities ───────────────────────────────────────────────────────
export type { CreditLimit, CreditStatus } from './slices/credit/entities/credit-limit.js';
export type { CreditReview, ReviewOutcome } from './slices/credit/entities/credit-review.js';

// ─── Credit services ───────────────────────────────────────────────────────
export {
  placeCreditHold,
  releaseCreditHold,
  type CreditHoldInput,
  type CreditReleaseInput,
} from './slices/credit/services/credit-hold-release.js';
export {
  writeOffBadDebt,
  type BadDebtWriteOffInput,
  type BadDebtWriteOffResult,
} from './slices/credit/services/bad-debt-write-off.js';

// ─── Credit calculators ────────────────────────────────────────────────────
export {
  checkCreditLimit as checkCmCreditLimit,
  type CreditCheckInput,
  type CreditCheckResult,
  type CreditDecision,
} from './slices/credit/calculators/credit-check.js';
export {
  computeCreditExposure,
  type CreditExposureInput,
  type CreditExposureResult,
  type ExposureItem,
} from './slices/credit/calculators/credit-exposure.js';
export {
  computeEcl as computeCmEcl,
  type EclInput as CmEclInput,
  type EclResult as CmEclResult,
  type AgingBucket as CmAgingBucket,
  type EclBucketResult,
} from './slices/credit/calculators/ecl-calculator.js';

// ─── Credit route registrars ───────────────────────────────────────────────
export { registerCreditRoutes } from './slices/credit/routes/credit-routes.js';

// ─── Expense ports ────────────────────────────────────────────────────────
export type {
  IExpenseClaimRepo,
  CreateExpenseClaimInput,
  CreateExpenseClaimLineInput,
} from './slices/expense/ports/expense-claim-repo.js';
export type {
  IExpensePolicyRepo,
  CreateExpensePolicyInput,
} from './slices/expense/ports/expense-policy-repo.js';

// ─── Expense entities ─────────────────────────────────────────────────────
export type { ExpenseClaim, ClaimStatus } from './slices/expense/entities/expense-claim.js';
export type {
  ExpenseClaimLine,
  ExpenseCategory,
} from './slices/expense/entities/expense-claim-line.js';
export type { ExpensePolicy } from './slices/expense/entities/expense-policy.js';

// ─── Expense services ─────────────────────────────────────────────────────
export {
  submitExpenseClaim,
  type SubmitExpenseClaimInput,
} from './slices/expense/services/submit-expense-claim.js';
export {
  reimburseExpenseClaim,
  type ReimburseExpenseClaimInput,
  type ReimburseExpenseClaimResult,
} from './slices/expense/services/reimburse-expense-claim.js';

// ─── Expense calculators ──────────────────────────────────────────────────
export {
  enforceExpensePolicy,
  type PolicyCheckLine,
  type PolicyViolation,
  type PolicyCheckResult,
} from './slices/expense/calculators/policy-enforcement.js';
export {
  computePerDiem,
  computeMileage,
  type PerDiemInput,
  type PerDiemResult,
  type MileageInput,
  type MileageResult,
} from './slices/expense/calculators/per-diem-mileage.js';
export {
  computeFxReimbursement,
  type FxReimbursementInput,
  type FxReimbursementResult,
} from './slices/expense/calculators/fx-reimbursement.js';

// ─── Expense route registrars ─────────────────────────────────────────────
export { registerExpenseRoutes } from './slices/expense/routes/expense-routes.js';

// ─── Project ports ────────────────────────────────────────────────────────
export type {
  IProjectRepo,
  CreateProjectInput,
  CreateProjectCostLineInput,
  CreateProjectBillingInput,
} from './slices/project/ports/project-repo.js';

// ─── Project entities ─────────────────────────────────────────────────────
export type { Project, ProjectStatus, BillingType } from './slices/project/entities/project.js';
export type { ProjectCostLine, CostCategory } from './slices/project/entities/project-cost-line.js';
export type { ProjectBilling, BillingStatus } from './slices/project/entities/project-billing.js';

// ─── Project services ────────────────────────────────────────────────────
export {
  transferWipToRevenue,
  type TransferWipToRevenueInput,
  type TransferWipToRevenueResult,
} from './slices/project/services/transfer-wip-to-revenue.js';
export { billProject, type BillProjectInput } from './slices/project/services/bill-project.js';

// ─── Project calculators ──────────────────────────────────────────────────
export {
  computeEarnedValue,
  type EarnedValueInput,
  type EarnedValueResult,
} from './slices/project/calculators/earned-value.js';
export {
  computePctCompletion,
  type PctCompletionInput,
  type PctCompletionResult,
} from './slices/project/calculators/pct-completion.js';
export {
  computeProjectProfitability,
  type ProfitabilityInput,
  type ProfitabilityResult,
} from './slices/project/calculators/project-profitability.js';

// ─── Project route registrars ─────────────────────────────────────────────
export { registerProjectRoutes } from './slices/project/routes/project-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Lease Accounting (IFRS 16)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Lease entities ──────────────────────────────────────────────────────
export type {
  LeaseContract,
  LeaseType,
  LeaseStatus,
} from './slices/lease/entities/lease-contract.js';
export type { LeaseSchedule } from './slices/lease/entities/lease-schedule.js';
export type {
  LeaseModification,
  ModificationType,
} from './slices/lease/entities/lease-modification.js';

// ─── Lease ports ─────────────────────────────────────────────────────────
export type {
  ILeaseContractRepo,
  CreateLeaseContractInput,
} from './slices/lease/ports/lease-contract-repo.js';
export type {
  ILeaseScheduleRepo,
  CreateLeaseScheduleInput,
} from './slices/lease/ports/lease-schedule-repo.js';
export type {
  ILeaseModificationRepo,
  CreateLeaseModificationInput,
} from './slices/lease/ports/lease-modification-repo.js';

// ─── Lease calculators ───────────────────────────────────────────────────
export {
  computeLeaseRecognition,
  type LeaseRecognitionInput,
  type LeaseRecognitionResult,
} from './slices/lease/calculators/lease-recognition.js';
export {
  computeAmortizationSchedule,
  type AmortizationScheduleInput,
  type AmortizationLine,
  type AmortizationScheduleResult,
} from './slices/lease/calculators/amortization-schedule.js';
export {
  computeLeaseModification,
  type LeaseModificationCalcInput,
  type LeaseModificationCalcResult,
} from './slices/lease/calculators/lease-modification-calc.js';
export {
  checkLeaseExemptions,
  type LeaseExemptionInput,
  type LeaseExemptionResult,
} from './slices/lease/calculators/lease-exemptions.js';
export {
  computeSaleLeaseback,
  type SaleLeasebackInput,
  type SaleLeasebackResult,
} from './slices/lease/calculators/sale-leaseback.js';
export {
  classifyLessorLease,
  type LessorClassificationInput,
  type LessorClassificationResult,
  type LessorLeaseType,
} from './slices/lease/calculators/lessor-classification.js';

// ─── Lease services ──────────────────────────────────────────────────────
export { modifyLease, type ModifyLeaseInput } from './slices/lease/services/modify-lease.js';

// ─── Lease route registrars ──────────────────────────────────────────────
export { registerLeaseRoutes } from './slices/lease/routes/lease-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Provisions (IAS 37)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Provision entities ──────────────────────────────────────────────────
export type {
  Provision,
  ProvisionType,
  ProvisionStatus,
} from './slices/provision/entities/provision.js';
export type {
  ProvisionMovement,
  ProvisionMovementType,
} from './slices/provision/entities/provision-movement.js';

// ─── Provision ports ─────────────────────────────────────────────────────
export type {
  IProvisionRepo,
  CreateProvisionInput,
} from './slices/provision/ports/provision-repo.js';
export type {
  IProvisionMovementRepo,
  CreateProvisionMovementInput,
} from './slices/provision/ports/provision-movement-repo.js';

// ─── Provision calculators ───────────────────────────────────────────────
export {
  checkRecognitionCriteria,
  type RecognitionCriteriaInput,
  type RecognitionCriteriaResult,
} from './slices/provision/calculators/recognition-criteria.js';
export {
  computeDiscountUnwind,
  type DiscountUnwindInput,
  type DiscountUnwindResult,
} from './slices/provision/calculators/discount-unwind.js';
export {
  computeOnerousContract,
  type OnerousContractInput,
  type OnerousContractResult,
} from './slices/provision/calculators/onerous-contract.js';

// ─── Provision services ──────────────────────────────────────────────────
export {
  utiliseProvision,
  type UtiliseProvisionInput,
} from './slices/provision/services/utilise-provision.js';

// ─── Provision route registrars ──────────────────────────────────────────
export { registerProvisionRoutes } from './slices/provision/routes/provision-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Treasury & Cash Management
// ═══════════════════════════════════════════════════════════════════════════

// ─── Treasury entities ───────────────────────────────────────────────────
export type { CashForecast, ForecastType } from './slices/treasury/entities/cash-forecast.js';
export type {
  Covenant,
  CovenantType,
  CovenantStatus,
} from './slices/treasury/entities/covenant.js';
export type { IcLoan, IcLoanStatus } from './slices/treasury/entities/ic-loan.js';

// ─── Treasury ports ──────────────────────────────────────────────────────
export type {
  ICashForecastRepo,
  CreateCashForecastInput,
} from './slices/treasury/ports/cash-forecast-repo.js';
export type { ICovenantRepo, CreateCovenantInput } from './slices/treasury/ports/covenant-repo.js';
export type { IIcLoanRepo, CreateIcLoanInput } from './slices/treasury/ports/ic-loan-repo.js';

// ─── Treasury calculators ────────────────────────────────────────────────
export {
  computeCashFlowForecast,
  type ForecastItem,
  type ForecastPeriod,
  type CashFlowForecastResult,
} from './slices/treasury/calculators/cash-flow-forecast.js';
export {
  computeCashPooling,
  type PoolAccount,
  type CashPoolingResult,
} from './slices/treasury/calculators/cash-pooling.js';
export {
  testCovenant,
  type CovenantTestInput,
  type CovenantTestResult,
  type CovenantComplianceStatus,
} from './slices/treasury/calculators/covenant-monitor.js';
export {
  computeFxExposure,
  type FxExposureItem,
  type CurrencyExposure,
  type FxExposureResult,
} from './slices/treasury/calculators/fx-exposure.js';

// ─── Treasury route registrars ───────────────────────────────────────────
export { registerTreasuryRoutes } from './slices/treasury/routes/treasury-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Financial Instruments (IFRS 9)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Fin-Instruments entities ────────────────────────────────────────────
export type {
  FinancialInstrument,
  InstrumentClassification,
  InstrumentType,
  FairValueLevel,
} from './slices/fin-instruments/entities/financial-instrument.js';

// ─── Fin-Instruments ports ───────────────────────────────────────────────
export type {
  IFinInstrumentRepo,
  CreateFinInstrumentInput,
} from './slices/fin-instruments/ports/fin-instrument-repo.js';
export type {
  IFairValueMeasurementRepo,
  FairValueMeasurement,
  CreateFairValueMeasurementInput,
} from './slices/fin-instruments/ports/fair-value-measurement-repo.js';

// ─── Fin-Instruments calculators ─────────────────────────────────────────
export {
  classifyInstruments,
  type BusinessModel,
  type ClassificationInput,
  type ClassificationResult,
} from './slices/fin-instruments/calculators/classification.js';
export {
  evaluateDerecognition,
  type DerecognitionInput,
  type DerecognitionOutcome,
  type DerecognitionResult,
} from './slices/fin-instruments/calculators/derecognition.js';
export {
  computeEcl as computeFinEcl,
  type EclStage,
  type EclInput as FinEclInput,
  type EclResult as FinEclResult,
} from './slices/fin-instruments/calculators/ecl.js';
export {
  computeEir,
  type EirInput,
  type EirResult,
} from './slices/fin-instruments/calculators/effective-interest-rate.js';
export {
  computeFairValue,
  type FairValueInput,
  type FairValueResult,
} from './slices/fin-instruments/calculators/fair-value.js';

// ─── Fin-Instruments route registrars ────────────────────────────────────
export { registerFinInstrumentRoutes } from './slices/fin-instruments/routes/fin-instrument-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Hedge Accounting (IFRS 9)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Hedge entities ──────────────────────────────────────────────────────
export type {
  HedgeRelationship,
  HedgeType,
  HedgeStatus,
} from './slices/hedge/entities/hedge-relationship.js';

// ─── Hedge ports ─────────────────────────────────────────────────────────
export type {
  IHedgeRelationshipRepo,
  CreateHedgeRelationshipInput,
} from './slices/hedge/ports/hedge-relationship-repo.js';
export type {
  IHedgeEffectivenessTestRepo,
  HedgeEffectivenessTest,
  CreateHedgeEffectivenessTestInput,
  HedgeTestMethod,
  HedgeTestResult,
} from './slices/hedge/ports/hedge-effectiveness-test-repo.js';

// ─── Hedge calculators ───────────────────────────────────────────────────
export {
  testEffectiveness,
  type EffectivenessMethod,
  type EffectivenessInput,
  type EffectivenessResult,
} from './slices/hedge/calculators/effectiveness.js';
export {
  computeOciReserve,
  type OciReserveInput,
  type OciReserveResult,
} from './slices/hedge/calculators/oci-reserve.js';

// ─── Hedge route registrars ─────────────────────────────────────────────
export { registerHedgeRoutes } from './slices/hedge/routes/hedge-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Intangible Assets (IAS 38)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Intangibles entities ────────────────────────────────────────────────
export type {
  IntangibleAsset,
  IntangibleAssetStatus,
  AmortizationMethod,
  IntangibleCategory,
  UsefulLifeType,
} from './slices/intangibles/entities/intangible-asset.js';

// ─── Intangibles ports ──────────────────────────────────────────────────
export type {
  IIntangibleAssetRepo,
  CreateIntangibleAssetInput,
} from './slices/intangibles/ports/intangible-asset-repo.js';

// ─── Intangibles calculators ────────────────────────────────────────────
export {
  computeAmortization,
  type AmortizationInput,
  type AmortizationResult,
} from './slices/intangibles/calculators/amortization.js';
export {
  checkRecognition,
  type ExpenditurePhase,
  type RecognitionInput,
  type RecognitionResult,
} from './slices/intangibles/calculators/recognition.js';
export {
  classifySoftwareCosts,
  type SoftwarePhase,
  type SoftwareCostInput,
  type SoftwareCostResult,
} from './slices/intangibles/calculators/software-capitalization.js';

// ─── Intangibles route registrars ───────────────────────────────────────
export { registerIntangibleRoutes } from './slices/intangibles/routes/intangible-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Deferred Tax (IAS 12)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Deferred Tax entities ───────────────────────────────────────────────
export type { DeferredTaxItem as DeferredTaxItemEntity } from './slices/deferred-tax/entities/deferred-tax-item.js';

// ─── Deferred Tax ports ─────────────────────────────────────────────────
export type {
  IDeferredTaxItemRepo,
  CreateDeferredTaxItemInput,
} from './slices/deferred-tax/ports/deferred-tax-item-repo.js';

// ─── Deferred Tax calculators ───────────────────────────────────────────
export {
  identifyTemporaryDifferences,
  type TempDiffType,
  type TempDiffOrigin,
  type TempDiffInput,
  type TempDiffResult,
} from './slices/deferred-tax/calculators/temporary-differences.js';
export {
  computeDtaDtl,
  type DtaInput,
  type DtaResult,
  type DtaSummary,
} from './slices/deferred-tax/calculators/dta-dtl.js';
export {
  computeRateChangeImpact,
  type RateChangeInput,
  type RateChangeResult,
  type RateChangeSummary,
} from './slices/deferred-tax/calculators/rate-change-impact.js';
export {
  computeMovementSchedule,
  type MovementType as DtMovementType,
  type MovementInput,
  type MovementRow,
  type MovementScheduleResult,
} from './slices/deferred-tax/calculators/movement-schedule.js';

// ─── Deferred Tax route registrars ──────────────────────────────────────
export { registerDeferredTaxRoutes } from './slices/deferred-tax/routes/deferred-tax-routes.js';

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Transfer Pricing
// ═══════════════════════════════════════════════════════════════════════════

// ─── Transfer Pricing entities ───────────────────────────────────────────
export type { TpPolicy } from './slices/transfer-pricing/entities/tp-policy.js';
export type {
  TpBenchmark,
  TpBenchmarkMethod,
} from './slices/transfer-pricing/entities/tp-benchmark.js';

// ─── Transfer Pricing ports ─────────────────────────────────────────────
export type {
  ITpPolicyRepo,
  CreateTpPolicyInput,
} from './slices/transfer-pricing/ports/tp-policy-repo.js';
export type {
  ITpBenchmarkRepo,
  CreateTpBenchmarkInput,
} from './slices/transfer-pricing/ports/tp-benchmark-repo.js';

// ─── Transfer Pricing calculators ───────────────────────────────────────
export {
  validateTpMethod,
  type TpMethod,
  type TpMethodInput,
  type TpMethodResult,
} from './slices/transfer-pricing/calculators/tp-methods.js';
export {
  computeCbcr,
  type CbcrEntityInput,
  type CbcrJurisdictionRow,
  type CbcrResult,
} from './slices/transfer-pricing/calculators/cbcr.js';
export {
  testThinCapitalization,
  type ThinCapInput,
  type ThinCapResult,
} from './slices/transfer-pricing/calculators/thin-capitalization.js';

// ─── Transfer Pricing route registrars ──────────────────────────────────
export { registerTransferPricingRoutes } from './slices/transfer-pricing/routes/transfer-pricing-routes.js';
export type {
  CbcrFilingInput,
  CbcrFilingResult,
  CbcrFilingMetadata,
  CbcrFilingStatus,
  CbcrValidationResult,
} from './slices/transfer-pricing/calculators/cbcr-filing.js';
export { generateCbcrFiling } from './slices/transfer-pricing/calculators/cbcr-filing.js';

// ═══════════════════════════════════════════════════════════════════════════
// GAP-A2: Approval Workflow
// ═══════════════════════════════════════════════════════════════════════════

// ─── Approval entities ──────────────────────────────────────────────────
export type {
  ApprovalRequest,
  ApprovalStep,
  ApprovalRequestStatus,
  ApprovalStepStatus,
} from './shared/entities/approval-request.js';
export type {
  ApprovalPolicy,
  ApprovalRule,
  ApprovalChainStep,
  ApprovalCondition,
  ConditionOperator,
  ApproverType,
  ChainMode,
} from './shared/entities/approval-policy.js';

// ─── Approval ports ─────────────────────────────────────────────────────
export type { IApprovalWorkflow, SubmitApprovalInput } from './shared/ports/approval-workflow.js';
export type {
  IApprovalPolicyRepo,
  CreateApprovalPolicyInput,
} from './shared/ports/approval-policy-repo.js';
export type {
  IApprovalRequestRepo,
  CreateApprovalRequestInput,
  CreateApprovalStepInput,
} from './shared/ports/approval-request-repo.js';

// ─── Approval calculators ───────────────────────────────────────────────
export { routeApproval } from './shared/calculators/approval-routing.js';

// ─── Approval route registrars ──────────────────────────────────────────
export { registerApprovalRoutes } from './shared/routes/approval-routes.js';

// ─── Shared ─────────────────────────────────────────────────────────────────
export { FinanceEventType } from './shared/events.js';
