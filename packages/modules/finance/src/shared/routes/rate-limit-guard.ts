/**
 * GAP-15: Per-tenant rate limiting preHandler.
 *
 * In-memory sliding window rate limiter keyed by tenant ID.
 * Rejects requests with 429 when a tenant exceeds the configured
 * requests-per-window threshold.
 *
 * For production, replace with a Redis-backed implementation
 * (e.g. @fastify/rate-limit with Redis store) for multi-instance support.
 */
import type { FastifyRequest, FastifyReply } from 'fastify';

export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60_000, // 1 minute
};

interface WindowEntry {
  timestamps: number[];
}

const tenantWindows = new Map<string, WindowEntry>();

function pruneWindow(entry: WindowEntry, now: number, windowMs: number): void {
  const cutoff = now - windowMs;
  while (entry.timestamps.length > 0 && entry.timestamps[0]! < cutoff) {
    entry.timestamps.shift();
  }
}

/**
 * Returns a Fastify preHandler that enforces per-tenant rate limits.
 */
export function registerRateLimitGuard(config?: Partial<RateLimitConfig>) {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) return; // tenant guard handles missing tenant

    const now = Date.now();
    let entry = tenantWindows.get(tenantId);
    if (!entry) {
      entry = { timestamps: [] };
      tenantWindows.set(tenantId, entry);
    }

    pruneWindow(entry, now, windowMs);

    if (entry.timestamps.length >= maxRequests) {
      reply.header('Retry-After', Math.ceil(windowMs / 1000).toString());
      return reply.status(429).send({
        error: {
          code: 'RATE_LIMITED',
          message: `Tenant ${tenantId} exceeded ${maxRequests} requests per ${windowMs / 1000}s window`,
        },
      });
    }

    entry.timestamps.push(now);
  };
}

/**
 * Clears all rate limit state. Useful for testing.
 */
export function resetRateLimitState(): void {
  tenantWindows.clear();
}
