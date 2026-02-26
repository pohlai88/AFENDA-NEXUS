/**
 * Retry helper for Neon transient connection errors.
 *
 * Neon compute restarts (maintenance, scale-to-zero) cause brief drops.
 * Retry with exponential backoff + jitter for these SQLSTATEs:
 * - 57P01 admin_shutdown
 * - 08006 connection_failure
 * - 08003 connection_does_not_exist
 *
 * @see https://neon.com/guides/building-resilient-applications-with-postgres
 */

const TRANSIENT_SQLSTATES = new Set(['57P01', '08006', '08003']);

function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code =
    (err as { code?: string; sqlState?: string }).code ?? (err as { sqlState?: string }).sqlState;
  if (code && TRANSIENT_SQLSTATES.has(code)) return true;
  const msg = String((err as Error).message ?? '');
  return (
    msg.includes('admin_shutdown') ||
    msg.includes('connection_failure') ||
    msg.includes('connection_does_not_exist') ||
    msg.includes('connection terminated') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT')
  );
}

export interface RetryOptions {
  /** Max retries (default 3) */
  maxRetries?: number;
  /** Base delay in ms (default 1000) */
  baseDelayMs?: number;
  /** Add jitter to prevent thundering herd (default true) */
  jitter?: boolean;
}

/**
 * Retries an async operation on transient Neon errors.
 * Use for health checks, critical reads; pair with idempotency for writes.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, jitter = true } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries || !isTransientError(err)) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      const ms = jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
      await new Promise((r) => setTimeout(r, ms));
    }
  }
  throw lastErr;
}
