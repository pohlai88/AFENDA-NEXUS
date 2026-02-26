import type { AppError } from '@afenda/core';

/**
 * @see GAP-03 — Complete error classification
 *
 * Maps every domain error code to an appropriate HTTP status.
 * No business validation failure should produce a 5xx response.
 */
export function mapErrorToStatus(error: AppError): number {
  switch (error.code) {
    // 400 — Bad Request (input validation failures)
    case 'VALIDATION':
    case 'VALIDATION_ERROR':
    case 'NO_BUDGET_DATA':
    case 'AP_INVALID_INVOICE_INPUT':
    case 'AP_INVALID_HOLD_INPUT':
    case 'AP_INVALID_SUPPLIER_INPUT':
      return 400;

    // 403 — Forbidden (authorization / boundary violations)
    case 'FORBIDDEN':
    case 'COMPANY_MISMATCH':
    case 'AUTHORIZATION':
      return 403;

    // 404 — Not Found
    case 'NOT_FOUND':
    case 'ACCOUNT_NOT_FOUND':
    case 'AP_INVOICE_NOT_FOUND':
    case 'AP_SUPPLIER_NOT_FOUND':
    case 'AP_HOLD_NOT_FOUND':
    case 'AP_PAYMENT_RUN_NOT_FOUND':
    case 'AP_PAYMENT_TERMS_NOT_FOUND':
      return 404;

    // 409 — Conflict (state / idempotency violations)
    case 'INVALID_STATE':
    case 'IDEMPOTENCY_CONFLICT':
    case 'AP_INVOICE_ALREADY_POSTED':
    case 'AP_INVOICE_ALREADY_PAID':
    case 'AP_INVOICE_CANCELLED':
    case 'AP_HOLD_ALREADY_RELEASED':
    case 'AP_PAYMENT_RUN_NOT_APPROVED':
    case 'AP_PAYMENT_RUN_ALREADY_EXECUTED':
    case 'AP_PAYMENT_RUN_NOT_EXECUTED':
      return 409;

    // 422 — Unprocessable Entity (domain rule violations)
    case 'UNBALANCED_JOURNAL':
    case 'INSUFFICIENT_LINES':
    case 'PERIOD_NOT_OPEN':
    case 'POSTING_DATE_OUT_OF_RANGE':
    case 'AP_INVOICE_HAS_ACTIVE_HOLDS':
    case 'AP_INVOICE_HAS_PARTIAL_PAYMENT':
    case 'AP_DUPLICATE_DETECTED':
    case 'AP_MATCH_OVER_TOLERANCE':
    case 'AP_PERIOD_CLOSED':
    case 'AP_PAYMENT_RUN_EMPTY':
      return 422;

    // 429 — Too Many Requests
    case 'RATE_LIMIT':
      return 429;

    // 500 — Internal Server Error (infrastructure failures only)
    case 'INTERNAL':
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}
