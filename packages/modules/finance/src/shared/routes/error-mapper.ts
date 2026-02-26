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
      return 400;

    // 403 — Forbidden (authorization / boundary violations)
    case 'FORBIDDEN':
    case 'COMPANY_MISMATCH':
    case 'AUTHORIZATION':
      return 403;

    // 404 — Not Found
    case 'NOT_FOUND':
    case 'ACCOUNT_NOT_FOUND':
      return 404;

    // 409 — Conflict (state / idempotency violations)
    case 'INVALID_STATE':
    case 'IDEMPOTENCY_CONFLICT':
      return 409;

    // 422 — Unprocessable Entity (domain rule violations)
    case 'UNBALANCED_JOURNAL':
    case 'INSUFFICIENT_LINES':
    case 'PERIOD_NOT_OPEN':
    case 'POSTING_DATE_OUT_OF_RANGE':
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
