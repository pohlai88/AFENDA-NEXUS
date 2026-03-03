/**
 * SP-1009: Idempotency Standard — Idempotency-Key header support for all portal mutations.
 *
 * Reuses the existing IIdempotencyStore port from @afenda/core or modules.
 * This module provides the portal-specific wrapper and convenience functions.
 */

// ─── Idempotency Types ──────────────────────────────────────────────────────

export interface IdempotencyClaimInput {
  readonly tenantId: string;
  readonly idempotencyKey: string;
  readonly commandType: string;
}

export type IdempotencyResult =
  | { readonly claimed: true }
  | { readonly claimed: false; readonly resultRef?: string };

// ─── Idempotency Store Port ─────────────────────────────────────────────────

/**
 * Port for idempotency checking.
 *
 * Mirrors IIdempotencyStore from the core/modules layer.
 * Portal routes call claimOrGet() before executing any mutation.
 */
export interface IPortalIdempotencyStore {
  /**
   * Attempt to claim an idempotency key.
   *
   * - If claimed → execute the mutation and call recordOutcome().
   * - If already processed → return cached result (HTTP 200, not 409).
   *
   * Key TTL: 24 hours (configurable).
   */
  claimOrGet(input: IdempotencyClaimInput): Promise<IdempotencyResult>;

  /**
   * Record the outcome of a claimed mutation.
   */
  recordOutcome(
    tenantId: string,
    key: string,
    commandType: string,
    resultRef: string
  ): Promise<void>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract the Idempotency-Key header value from request headers.
 * Returns undefined if not present.
 */
export function extractIdempotencyKey(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const value = headers['idempotency-key'];
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Validate that an idempotency key is a valid UUID.
 */
export function isValidIdempotencyKey(key: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
}
