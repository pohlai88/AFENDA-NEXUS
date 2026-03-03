/**
 * SP-4001: Case State Machine — pure state transition logic.
 *
 * SP-DB-10: Valid lifecycle:
 *   DRAFT → SUBMITTED → ASSIGNED → IN_PROGRESS → AWAITING_INFO → RESOLVED → CLOSED
 *                                                                     ↑          ↓
 *                                                                     └── REOPENED
 *
 * No I/O. Pure deterministic transitions.
 */

// ─── Case Status ────────────────────────────────────────────────────────────

export const CASE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_INFO',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

// ─── Case Categories ────────────────────────────────────────────────────────

export const CASE_CATEGORIES = [
  'PAYMENT',
  'INVOICE',
  'COMPLIANCE',
  'DELIVERY',
  'QUALITY',
  'ONBOARDING',
  'GENERAL',
  'ESCALATION',
] as const;

export type CaseCategory = (typeof CASE_CATEGORIES)[number];

// ─── Case Priority ──────────────────────────────────────────────────────────

export const CASE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];

// ─── Transition Rules ───────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<CaseStatus, readonly CaseStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'AWAITING_INFO'],
  IN_PROGRESS: ['AWAITING_INFO', 'RESOLVED'],
  AWAITING_INFO: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['ASSIGNED', 'IN_PROGRESS'],
};

/**
 * Check if a state transition is valid.
 * Pure function — deterministic, no I/O.
 */
export function isValidCaseTransition(from: CaseStatus, to: CaseStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Get all valid next statuses from a given status.
 */
export function getValidNextStatuses(from: CaseStatus): readonly CaseStatus[] {
  return VALID_TRANSITIONS[from];
}

/**
 * Assert a state transition is valid. Throws if not.
 */
export function assertCaseTransition(from: CaseStatus, to: CaseStatus): void {
  if (!isValidCaseTransition(from, to)) {
    throw new InvalidCaseTransitionError(from, to);
  }
}

/**
 * Check if a case status is terminal (no further transitions possible except reopen).
 */
export function isTerminalStatus(status: CaseStatus): boolean {
  return status === 'CLOSED';
}

/**
 * Check if a case status means the case is actively being worked on.
 */
export function isActiveStatus(status: CaseStatus): boolean {
  return ['ASSIGNED', 'IN_PROGRESS', 'AWAITING_INFO', 'REOPENED'].includes(status);
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class InvalidCaseTransitionError extends Error {
  readonly code = 'INVALID_CASE_TRANSITION' as const;

  constructor(
    readonly from: CaseStatus,
    readonly to: CaseStatus
  ) {
    super(
      `Invalid case transition: '${from}' → '${to}'. Valid transitions: ${VALID_TRANSITIONS[from].join(', ')}`
    );
    this.name = 'InvalidCaseTransitionError';
  }
}
