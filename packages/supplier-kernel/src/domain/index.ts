/**
 * @afenda/supplier-kernel/domain — Pure domain logic.
 *
 * Zero I/O, zero DB, zero HTTP. Deterministic computations only.
 */

// ─── Case State Machine (SP-4001) ───────────────────────────────────────────
export {
  CASE_STATUSES,
  CASE_CATEGORIES,
  CASE_PRIORITIES,
  type CaseStatus,
  type CaseCategory,
  type CasePriority,
  isValidCaseTransition,
  getValidNextStatuses,
  assertCaseTransition,
  isTerminalStatus,
  isActiveStatus,
  InvalidCaseTransitionError,
} from './case-state-machine.js';

// ─── Payment Stage Machine (SP-4002) ────────────────────────────────────────
export {
  PAYMENT_STAGES,
  PAYMENT_SOURCES,
  type PaymentStage,
  type PaymentSource,
  hasHigherPrecedence,
  isValidPaymentTransition,
  getValidNextStages,
  assertPaymentTransition,
  isTerminalStage,
  InvalidPaymentTransitionError,
} from './payment-stage-machine.js';

// ─── SLA Calculator (SP-4003) ───────────────────────────────────────────────
export {
  type SlaConfig,
  getSlaConfig,
  computeSlaDeadline,
  isSlaBreached,
  slaRemainingMs,
  slaProgressPercent,
} from './sla-calculator.js';

// ─── Bulk Upload Fingerprint (SP-4004) ──────────────────────────────────────
export {
  DEDUPE_POLICIES,
  type DedupePolicy,
  type BulkUploadRow,
  type DedupeCheckResult,
  computeRowFingerprintInput,
  computeRowFingerprint,
} from './bulk-upload-fingerprint.js';
