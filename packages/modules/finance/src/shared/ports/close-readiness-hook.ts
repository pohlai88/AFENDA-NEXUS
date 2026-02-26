/**
 * Cross-slice hook for close-readiness determination.
 * GL's close-year service uses these via shared instead of importing
 * directly from the reporting slice.
 */
export { classifyIncomeStatement } from '../../slices/reporting/calculators/report-classifier.js';
export type {
  ClassifiableRow,
  IncomeStatementSections,
} from '../../slices/reporting/calculators/report-classifier.js';
export { resolveCloseReadiness } from '../../slices/reporting/calculators/close-checklist.js';
export type {
  CloseTask,
  CloseTaskStatus,
  CloseReadinessResult,
} from '../../slices/reporting/calculators/close-checklist.js';
