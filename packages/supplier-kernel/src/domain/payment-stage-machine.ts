/**
 * SP-4002: Payment Stage Machine — append-only fact model.
 *
 * SP-DB-05: Payment status is a fact table (never UPDATE).
 * SP-DB-06: No impossible transitions.
 * SP-DB-07: Source precedence: BANK_FILE > ERP > MANUAL_OVERRIDE.
 *
 * No I/O. Pure deterministic transitions.
 */

// ─── Payment Stage ──────────────────────────────────────────────────────────

export const PAYMENT_STAGES = [
  'SCHEDULED',
  'APPROVED',
  'PROCESSING',
  'SENT',
  'CLEARED',
  'ON_HOLD',
  'REJECTED',
] as const;

export type PaymentStage = (typeof PAYMENT_STAGES)[number];

// ─── Source Precedence ──────────────────────────────────────────────────────

export const PAYMENT_SOURCES = ['BANK_FILE', 'ERP', 'MANUAL_OVERRIDE'] as const;
export type PaymentSource = (typeof PAYMENT_SOURCES)[number];

/**
 * Source precedence: BANK_FILE > ERP > MANUAL_OVERRIDE.
 * A bank file update overrides a manual override.
 */
const SOURCE_PRECEDENCE: Record<PaymentSource, number> = {
  BANK_FILE: 3,
  ERP: 2,
  MANUAL_OVERRIDE: 1,
};

/**
 * Check if a source has equal or higher precedence than another.
 */
export function hasHigherPrecedence(incoming: PaymentSource, existing: PaymentSource): boolean {
  return SOURCE_PRECEDENCE[incoming] >= SOURCE_PRECEDENCE[existing];
}

// ─── Transition Rules ───────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<PaymentStage, readonly PaymentStage[]> = {
  SCHEDULED: ['APPROVED', 'ON_HOLD'],
  APPROVED: ['PROCESSING', 'ON_HOLD'],
  PROCESSING: ['SENT', 'ON_HOLD'],
  SENT: ['CLEARED', 'REJECTED'],
  CLEARED: [], // Terminal — no further transitions
  ON_HOLD: ['SCHEDULED', 'APPROVED', 'PROCESSING'], // Back to previous stage
  REJECTED: [], // Terminal — no further transitions
};

/**
 * Check if a payment stage transition is valid.
 * Pure function — deterministic, no I/O.
 */
export function isValidPaymentTransition(from: PaymentStage, to: PaymentStage): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Get all valid next stages from a given stage.
 */
export function getValidNextStages(from: PaymentStage): readonly PaymentStage[] {
  return VALID_TRANSITIONS[from];
}

/**
 * Assert a payment stage transition is valid. Throws if not.
 */
export function assertPaymentTransition(from: PaymentStage, to: PaymentStage): void {
  if (!isValidPaymentTransition(from, to)) {
    throw new InvalidPaymentTransitionError(from, to);
  }
}

/**
 * Check if a payment stage is terminal.
 */
export function isTerminalStage(stage: PaymentStage): boolean {
  return stage === 'CLEARED' || stage === 'REJECTED';
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class InvalidPaymentTransitionError extends Error {
  readonly code = 'INVALID_PAYMENT_TRANSITION' as const;

  constructor(
    readonly from: PaymentStage,
    readonly to: PaymentStage
  ) {
    const valid = VALID_TRANSITIONS[from];
    super(
      `Invalid payment transition: '${from}' → '${to}'. Valid transitions: ${valid.length > 0 ? valid.join(', ') : '(none — terminal stage)'}`
    );
    this.name = 'InvalidPaymentTransitionError';
  }
}
