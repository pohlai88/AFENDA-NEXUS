/**
 * Cross-slice hooks for report route integration.
 * Reporting routes use budget variance, alerts, and IC aging
 * via shared instead of importing directly from hub/ic slices.
 */
export { getBudgetVariance } from '../../slices/hub/services/get-budget-variance.js';
export type { GetBudgetVarianceInput } from '../../slices/hub/services/get-budget-variance.js';
export {
  evaluateVarianceAlerts,
  DEFAULT_THRESHOLD,
} from '../../slices/hub/calculators/variance-alerts.js';
export type {
  VarianceAlert,
  VarianceAlertResult,
  VarianceThreshold,
  AlertSeverity,
} from '../../slices/hub/calculators/variance-alerts.js';
export { computeIcAging } from '../../slices/ic/calculators/ic-aging.js';
export type {
  IcOpenItem,
  IcAgingReport,
  AgingBucket,
  AgingBucketSummary,
} from '../../slices/ic/calculators/ic-aging.js';
