export type { CalculatorResult } from "./journal-balance.js";
export { validateJournalBalance } from "./journal-balance.js";
export type { JournalBalanceLine, JournalBalanceResult } from "./journal-balance.js";

export { computeTrialBalance, classifyByAccountType } from "./trial-balance.js";
export type { TrialBalanceInput, ClassifiedTrialBalanceRow, ClassifiedTrialBalance } from "./trial-balance.js";

export { convertAmountPrecise, computeGainLoss } from "./fx-convert.js";
export type { FxConversionResult, FxGainLossResult } from "./fx-convert.js";

export { classifyBalanceSheet, classifyIncomeStatement, classifyCashFlow } from "./report-classifier.js";
export type {
  ClassifiableRow,
  BalanceSheetSections,
  IncomeStatementSections,
  CashFlowSections,
} from "./report-classifier.js";

export { validateCoaIntegrity, getSubtree, getAncestors } from "./coa-hierarchy.js";
export type { AccountNode, CoaIntegrityResult } from "./coa-hierarchy.js";

export { validateDimensions } from "./segment-dimension.js";
export type {
  DimensionType,
  DimensionValue,
  JournalLineDimensions,
  DimensionValidationResult,
} from "./segment-dimension.js";

export { computeEliminations } from "./ic-elimination.js";
export type { IntercompanyBalance, EliminationEntry } from "./ic-elimination.js";

export { translateTrialBalance } from "./fx-translation.js";
export type {
  TranslationRates,
  TrialBalanceEntry,
  TranslatedEntry,
  TranslationResult,
} from "./fx-translation.js";

export { resolveCloseReadiness, sequenceMultiCompanyClose } from "./close-checklist.js";
export type {
  CloseTaskStatus,
  CloseTask,
  CloseReadinessResult,
  MultiCompanyCloseOrder,
} from "./close-checklist.js";

export { computeRevaluation } from "./fx-revaluation.js";
export type { MonetaryBalance, RevaluationLine, RevaluationResult } from "./fx-revaluation.js";

export { derivePostings, allocateByDriver } from "./derivation-engine.js";
export type {
  DerivationRuleType,
  DerivationRule,
  SourceTransaction,
  DerivedLine,
  DerivationResult,
  AllocationDriver,
  AllocationResult,
} from "./derivation-engine.js";

export { deriveCashFlowIndirect } from "./cash-flow-indirect.js";
export type {
  TrialBalanceMovement,
  CashFlowSubType,
  CashFlowSection,
  CashFlowLine,
  IndirectCashFlowResult,
} from "./cash-flow-indirect.js";

export { triangulateRate, auditRateSources } from "./fx-triangulation.js";
export type {
  RateEntry,
  TriangulatedRate,
  TriangulationResult,
  RateAuditIssue,
  RateAuditResult,
} from "./fx-triangulation.js";

export { computeAccruals } from "./accrual-engine.js";
export type {
  AccrualType,
  AccrualMethod,
  AccrualSchedule,
  AccrualEntry,
  AccrualResult,
} from "./accrual-engine.js";

export { evaluateVarianceAlerts, DEFAULT_THRESHOLD } from "./variance-alerts.js";
export type {
  AlertSeverity,
  VarianceThreshold,
  VarianceAlert,
  VarianceAlertResult,
} from "./variance-alerts.js";

export { computeIcAging } from "./ic-aging.js";
export type {
  IcOpenItem,
  AgingBucket,
  AgingBucketSummary,
  IcAgingReport,
} from "./ic-aging.js";

export { computeDeferredRevenueRollForward } from "./deferred-revenue.js";
export type {
  DeferredRevenueEntry,
  DeferredRevenueLineResult,
  DeferredRevenueRollForward,
} from "./deferred-revenue.js";

export { computeStraightLineSchedule, computeMilestoneRecognition } from "./revenue-recognition.js";
export type {
  RecognitionScheduleInput,
  RecognitionScheduleResult,
  MilestoneInput,
  MilestoneScheduleResult,
} from "./revenue-recognition.js";

export { buildComparativeSection } from "./comparative-report.js";
export type { ComparativeSectionInput } from "./comparative-report.js";
