/**
 * SHIM — Phase 0 Strangler Fig.
 * Re-exports from new slice locations so existing import paths still resolve.
 * TODO: Remove this file once all consumers import from slices/ directly.
 */

// ─── GL slice entities ──────────────────────────────────────────────────────
export type { Journal, JournalLine } from "../slices/gl/entities/journal.js";
export type { Account, AccountType, NormalBalance } from "../slices/gl/entities/account.js";
export { normalBalanceFor, isBalanceDirectionValid } from "../slices/gl/entities/account.js";
export type { FiscalPeriod, PeriodStatus } from "../slices/gl/entities/fiscal-period.js";
export type { Ledger } from "../slices/gl/entities/ledger.js";
export type { GlBalance, TrialBalanceRow, TrialBalance } from "../slices/gl/entities/gl-balance.js";
export type { JournalAuditEntry } from "../slices/gl/entities/journal-audit.js";

// ─── FX slice entities ──────────────────────────────────────────────────────
export type { FxRate } from "../slices/fx/entities/fx-rate.js";
export { convertAmount } from "../slices/fx/entities/fx-rate.js";
export type {
    RateSource, ApprovalStatus, FxRateApproval, RateApprovalPolicy,
} from "../slices/fx/entities/fx-rate-approval.js";
export {
    requiresApproval, validateRateForPosting, validateRateSpread, DEFAULT_RATE_APPROVAL_POLICY,
} from "../slices/fx/entities/fx-rate-approval.js";

// ─── IC slice entities ──────────────────────────────────────────────────────
export type { IntercompanyRelationship, IntercompanyDocument } from "../slices/ic/entities/intercompany.js";
export type { IcSettlement, SettlementMethod, SettlementStatus } from "../slices/ic/entities/ic-settlement.js";

// ─── Hub slice entities ─────────────────────────────────────────────────────
export type {
    RevenueContract, RecognitionMethod, ContractStatus,
    RecognitionMilestone, RecognitionScheduleEntry,
} from "../slices/hub/entities/revenue-recognition.js";
export type { RecurringTemplate, RecurringTemplateLine, RecurringFrequency } from "../slices/hub/entities/recurring-template.js";
export type { BudgetEntry, BudgetVarianceRow, BudgetVarianceReport } from "../slices/hub/entities/budget.js";
export type {
    ReportingStandard, StatementCategory, ClassificationRule, ClassificationRuleSet,
} from "../slices/hub/entities/classification-rule.js";
export { resolveCategory, defaultIfrsRules } from "../slices/hub/entities/classification-rule.js";

// ─── Reporting slice entities ───────────────────────────────────────────────
export type {
    BalanceSheet, IncomeStatement, CashFlowStatement, ReportSection, ReportRow,
    ComparativeBalanceSheet, ComparativeIncomeStatement,
    ComparativeReportSection, ComparativeReportRow,
} from "../slices/reporting/entities/financial-reports.js";

// ─── Calculators (via calculators/index.ts shim) ────────────────────────────
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

// ─── Shared ─────────────────────────────────────────────────────────────────
export type { CurrencyConfig } from "../shared/currency-config.js";
export { getCurrencyConfig, getMinorUnitMultiplier } from "../shared/currency-config.js";
export { FinanceEventType } from "../shared/events.js";
export type { FinanceEventType as FinanceEventTypeValue } from "../shared/events.js";
export type { FinanceContext, FinanceActor } from "../shared/finance-context.js";
export { createFinanceContext } from "../shared/finance-context.js";
