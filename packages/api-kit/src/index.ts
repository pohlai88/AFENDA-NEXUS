/**
 * @afenda/api-kit — Shared infrastructure for Fastify-based API modules.
 *
 * Re-exports identity extraction, rate limiting, error handling,
 * error mapping, and outbox context helpers.
 */

// Fastify request identity — single source of truth
export { extractIdentity, type RequestIdentity } from './extract-identity.js';
export {
  rateLimitGuard,
  registerGlobalRateLimit,
  resetRateLimitState,
  type RateLimitConfig,
  type IRateLimitStore,
} from './rate-limit-guard.js';
export { registerErrorHandler, registerBigIntSerializer } from './error-handler.js';
export { mapErrorToStatus } from './error-mapper.js';
export { getOutboxMeta, type OutboxMeta } from './outbox-context.js';
