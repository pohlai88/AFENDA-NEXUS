/**
 * @afenda/api-kit — Outbox context helper.
 *
 * Reads the current AsyncLocalStorage context (set by tenant-context middleware)
 * and returns metadata to include in outbox rows. This ensures correlation IDs
 * propagate from HTTP request → DB transaction → outbox row → worker handler.
 */
import { getContext } from '@afenda/platform';

export interface OutboxMeta {
  readonly correlationId: string | undefined;
}

/**
 * Reads the current ALS context and returns outbox metadata.
 * Called by OutboxWriter implementations when writing outbox rows.
 */
export function getOutboxMeta(): OutboxMeta {
  const ctx = getContext();
  return { correlationId: ctx?.correlationId };
}
