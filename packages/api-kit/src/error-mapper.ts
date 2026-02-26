/**
 * @afenda/api-kit — Generic HTTP status mapping from AppError codes.
 *
 * Contains only generic error codes. Domain modules can extend this
 * by wrapping with their own mapper that handles domain-specific codes
 * before falling back to this one.
 */
import type { AppError } from '@afenda/core';

/**
 * Maps generic domain error codes to HTTP status codes.
 * Domain modules should create their own mapper for domain-specific codes
 * and fall through to this for generic ones.
 */
export function mapErrorToStatus(error: AppError): number {
  switch (error.code) {
    // 400 — Bad Request (input validation failures)
    case 'VALIDATION':
    case 'VALIDATION_ERROR':
      return 400;

    // 403 — Forbidden (authorization / boundary violations)
    case 'FORBIDDEN':
    case 'AUTHORIZATION':
      return 403;

    // 404 — Not Found
    case 'NOT_FOUND':
      return 404;

    // 409 — Conflict (state / idempotency violations)
    case 'INVALID_STATE':
    case 'IDEMPOTENCY_CONFLICT':
      return 409;

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
