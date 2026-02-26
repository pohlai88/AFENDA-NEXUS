import type { Result } from '@afenda/core';

/**
 * Generates unique, sequential document numbers per tenant and prefix.
 * Implementations must guarantee:
 * - Uniqueness within (tenantId, prefix) scope
 * - Monotonically increasing sequence
 * - Explainable gaps (audit trail for skipped numbers)
 */
export interface IDocumentNumberGenerator {
  next(tenantId: string, prefix: string): Promise<Result<string>>;
}
