/**
 * SHIM — Phase 0 Strangler Fig.
 * Re-exports calculators from new slice locations.
 * TODO: Remove once all consumers import from slices/ directly.
 */

// ─── GL calculators ─────────────────────────────────────────────────────────
export type { CalculatorResult } from "../../slices/gl/calculators/journal-balance.js";
export { validateJournalBalance } from "../../slices/gl/calculators/journal-balance.js";
export type { JournalBalanceLine, JournalBalanceResult } from "../../slices/gl/calculators/journal-balance.js";

export { computeTrialBalance, classifyByAccountType } from "../../slices/gl/calculators/trial-balance.js";
export type { TrialBalanceInput, ClassifiedTrialBalanceRow, ClassifiedTrialBalance } from "../../slices/gl/calculators/trial-balance.js";

export { validateCoaIntegrity, getSubtree, getAncestors } from "../../slices/gl/calculators/coa-hierarchy.js";
export type { AccountNode, CoaIntegrityResult } from "../../slices/gl/calculators/coa-hierarchy.js";

export { validateDimensions } from "../../slices/gl/calculators/segment-dimension.js";
export type {
  DimensionType, DimensionValue, JournalLineDimensions, DimensionValidationResult,
} from "../../slices/gl/calculators/segment-dimension.js";

// ─── FX calculators ─────────────────────────────────────────────────────────
export { convertAmountPrecise, computeGainLoss } from "../../slices/fx/calculators/fx-convert.js";
export type { FxConversionResult, FxGainLossResult } from "../../slices/fx/calculators/fx-convert.js";

export { translateTrialBalance } from "../../slices/fx/calculators/fx-translation.js";
export type {
  TranslationRates, TrialBalanceEntry, TranslatedEntry, TranslationResult,
} from "../../slices/fx/calculators/fx-translation.js";

export { computeRevaluation } from "../../slices/fx/calculators/fx-revaluation.js";
export type { MonetaryBalance, RevaluationLine, RevaluationResult } from "../../slices/fx/calculators/fx-revaluation.js";

export { triangulateRate, auditRateSources } from "../../slices/fx/calculators/fx-triangulation.js";
export type {
  RateEntry, TriangulatedRate, TriangulationResult, RateAuditIssue, RateAuditResult,
} from "../../slices/fx/calculators/fx-triangulation.js";

// ─── IC calculators ─────────────────────────────────────────────────────────
export { computeEliminations } from "../../slices/ic/calculators/ic-elimination.js";
export type { IntercompanyBalance, EliminationEntry } from "../../slices/ic/calculators/ic-elimination.js";

export { computeIcAging } from "../../slices/ic/calculators/ic-aging.js";
export type {
  IcOpenItem, AgingBucket, AgingBucketSummary, IcAgingReport,
} from "../../slices/ic/calculators/ic-aging.js";

// ─── Hub calculators ────────────────────────────────────────────────────────
export { derivePostings, allocateByDriver } from "../../slices/hub/calculators/derivation-engine.js";
export type {
  DerivationRuleType, DerivationRule, SourceTransaction, DerivedLine, DerivationResult,
  AllocationDriver, AllocationResult,
} from "../../slices/hub/calculators/derivation-engine.js";

export { computeAccruals } from "../../slices/hub/calculators/accrual-engine.js";
export type {
  AccrualType, AccrualMethod, AccrualSchedule, AccrualEntry, AccrualResult,
} from "../../slices/hub/calculators/accrual-engine.js";

export { evaluateVarianceAlerts, DEFAULT_THRESHOLD } from "../../slices/hub/calculators/variance-alerts.js";
export type {
  AlertSeverity, VarianceThreshold, VarianceAlert, VarianceAlertResult,
} from "../../slices/hub/calculators/variance-alerts.js";

export { computeDeferredRevenueRollForward } from "../../slices/hub/calculators/deferred-revenue.js";
export type {
  DeferredRevenueEntry, DeferredRevenueLineResult, DeferredRevenueRollForward,
} from "../../slices/hub/calculators/deferred-revenue.js";

export { computeStraightLineSchedule, computeMilestoneRecognition } from "../../slices/hub/calculators/revenue-recognition.js";
export type {
  RecognitionScheduleInput, RecognitionScheduleResult, MilestoneInput, MilestoneScheduleResult,
} from "../../slices/hub/calculators/revenue-recognition.js";

// ─── Reporting calculators ──────────────────────────────────────────────────
export { classifyBalanceSheet, classifyIncomeStatement, classifyCashFlow } from "../../slices/reporting/calculators/report-classifier.js";
export type {
  ClassifiableRow, BalanceSheetSections, IncomeStatementSections, CashFlowSections,
} from "../../slices/reporting/calculators/report-classifier.js";

export { resolveCloseReadiness, sequenceMultiCompanyClose } from "../../slices/reporting/calculators/close-checklist.js";
export type {
  CloseTaskStatus, CloseTask, CloseReadinessResult, MultiCompanyCloseOrder,
} from "../../slices/reporting/calculators/close-checklist.js";

export { deriveCashFlowIndirect } from "../../slices/reporting/calculators/cash-flow-indirect.js";
export type {
  TrialBalanceMovement, CashFlowSubType, CashFlowSection, CashFlowLine, IndirectCashFlowResult,
} from "../../slices/reporting/calculators/cash-flow-indirect.js";

export { buildComparativeSection } from "../../slices/reporting/calculators/comparative-report.js";
export type { ComparativeSectionInput } from "../../slices/reporting/calculators/comparative-report.js";
