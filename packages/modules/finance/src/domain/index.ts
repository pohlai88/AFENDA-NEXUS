export type { Journal, JournalLine } from "./entities/journal.js";
export type { Account, AccountType, NormalBalance } from "./entities/account.js";
export { normalBalanceFor, isBalanceDirectionValid } from "./entities/account.js";
export type { FiscalPeriod, PeriodStatus } from "./entities/fiscal-period.js";
export type { Ledger } from "./entities/ledger.js";
export type { FxRate } from "./entities/fx-rate.js";
export { convertAmount } from "./entities/fx-rate.js";
export type { GlBalance, TrialBalanceRow, TrialBalance } from "./entities/gl-balance.js";
export type { JournalAuditEntry } from "./entities/journal-audit.js";
export type { IntercompanyRelationship, IntercompanyDocument } from "./entities/intercompany.js";
export type { IcSettlement, SettlementMethod, SettlementStatus } from "./entities/ic-settlement.js";
export type {
    RevenueContract, RecognitionMethod, ContractStatus,
    RecognitionMilestone, RecognitionScheduleEntry,
} from "./entities/revenue-recognition.js";
export type { RecurringTemplate, RecurringTemplateLine, RecurringFrequency } from "./entities/recurring-template.js";
export type { BudgetEntry, BudgetVarianceRow, BudgetVarianceReport } from "./entities/budget.js";
export type {
    ReportingStandard, StatementCategory, ClassificationRule, ClassificationRuleSet,
} from "./entities/classification-rule.js";
export { resolveCategory, defaultIfrsRules } from "./entities/classification-rule.js";
export type {
    RateSource, ApprovalStatus, FxRateApproval, RateApprovalPolicy,
} from "./entities/fx-rate-approval.js";
export {
    requiresApproval, validateRateForPosting, validateRateSpread, DEFAULT_RATE_APPROVAL_POLICY,
} from "./entities/fx-rate-approval.js";
export type {
    BalanceSheet, IncomeStatement, CashFlowStatement, ReportSection, ReportRow,
    ComparativeBalanceSheet, ComparativeIncomeStatement,
    ComparativeReportSection, ComparativeReportRow,
} from "./entities/financial-reports.js";

// Pure calculators — no I/O, no side effects
export type { CalculatorResult } from "./calculators/index.js";
export { validateJournalBalance } from "./calculators/index.js";
export { computeTrialBalance, classifyByAccountType } from "./calculators/index.js";
export { convertAmountPrecise, computeGainLoss } from "./calculators/index.js";
export { classifyBalanceSheet, classifyIncomeStatement, classifyCashFlow } from "./calculators/index.js";
export { validateCoaIntegrity, getSubtree, getAncestors } from "./calculators/index.js";
export { validateDimensions } from "./calculators/index.js";
export { computeEliminations } from "./calculators/index.js";
export { translateTrialBalance } from "./calculators/index.js";
export { resolveCloseReadiness, sequenceMultiCompanyClose } from "./calculators/index.js";
export { computeRevaluation } from "./calculators/index.js";
export { derivePostings, allocateByDriver } from "./calculators/index.js";
export { deriveCashFlowIndirect } from "./calculators/index.js";
export { triangulateRate, auditRateSources } from "./calculators/index.js";
export { computeAccruals } from "./calculators/index.js";
export { evaluateVarianceAlerts, DEFAULT_THRESHOLD } from "./calculators/index.js";
export { computeIcAging } from "./calculators/index.js";
export { computeDeferredRevenueRollForward } from "./calculators/index.js";
export { computeStraightLineSchedule, computeMilestoneRecognition } from "./calculators/index.js";
export type {
    JournalBalanceLine, JournalBalanceResult,
    TrialBalanceInput, ClassifiedTrialBalanceRow, ClassifiedTrialBalance,
    FxConversionResult, FxGainLossResult,
    ClassifiableRow, BalanceSheetSections, IncomeStatementSections, CashFlowSections,
    AccountNode, CoaIntegrityResult,
    DimensionType, DimensionValue, JournalLineDimensions, DimensionValidationResult,
    IntercompanyBalance, EliminationEntry,
    TranslationRates, TrialBalanceEntry, TranslatedEntry, TranslationResult,
    CloseTaskStatus, CloseTask, CloseReadinessResult, MultiCompanyCloseOrder,
    MonetaryBalance, RevaluationLine, RevaluationResult,
    DerivationRuleType, DerivationRule, SourceTransaction, DerivedLine, DerivationResult,
    AllocationDriver, AllocationResult,
    TrialBalanceMovement, CashFlowSubType, CashFlowSection, CashFlowLine, IndirectCashFlowResult,
    RateEntry, TriangulatedRate, TriangulationResult, RateAuditIssue, RateAuditResult,
    AccrualType, AccrualMethod, AccrualSchedule, AccrualEntry, AccrualResult,
    AlertSeverity, VarianceThreshold, VarianceAlert, VarianceAlertResult,
    IcOpenItem, AgingBucket, AgingBucketSummary, IcAgingReport,
    DeferredRevenueEntry, DeferredRevenueLineResult, DeferredRevenueRollForward,
    RecognitionScheduleInput, RecognitionScheduleResult,
    MilestoneInput, MilestoneScheduleResult,
} from "./calculators/index.js";

// Currency precision registry (GAP-10)
export type { CurrencyConfig } from "./currency-config.js";
export { getCurrencyConfig, getMinorUnitMultiplier } from "./currency-config.js";

// Domain event type registry
export { FinanceEventType } from "./events.js";
export type { FinanceEventType as FinanceEventTypeValue } from "./events.js";

// Finance context — multi-tenant, multi-company, multi-currency
export type { FinanceContext, FinanceActor } from "./finance-context.js";
export { createFinanceContext } from "./finance-context.js";
