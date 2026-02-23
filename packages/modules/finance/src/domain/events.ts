/**
 * Canonical domain event type registry for the finance module.
 * All producers and consumers MUST reference these constants.
 * A typo becomes a compile-time error, not a silent runtime mismatch.
 */
export const FinanceEventType = {
  JOURNAL_CREATED: "JOURNAL_CREATED",
  JOURNAL_POSTED: "JOURNAL_POSTED",
  JOURNAL_REVERSED: "JOURNAL_REVERSED",
  JOURNAL_VOIDED: "JOURNAL_VOIDED",
  GL_BALANCE_CHANGED: "GL_BALANCE_CHANGED",
  PERIOD_CLOSED: "PERIOD_CLOSED",
  PERIOD_LOCKED: "PERIOD_LOCKED",
  PERIOD_REOPENED: "PERIOD_REOPENED",
  YEAR_CLOSED: "YEAR_CLOSED",
  IC_TRANSACTION_CREATED: "IC_TRANSACTION_CREATED",
  IC_SETTLEMENT_CONFIRMED: "IC_SETTLEMENT_CONFIRMED",
  REVENUE_RECOGNIZED: "REVENUE_RECOGNIZED",
  RECURRING_JOURNAL_CREATED: "RECURRING_JOURNAL_CREATED",
  RECURRING_JOURNALS_PROCESSED: "RECURRING_JOURNALS_PROCESSED",
} as const;

export type FinanceEventType = (typeof FinanceEventType)[keyof typeof FinanceEventType];
