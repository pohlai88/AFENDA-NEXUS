/**
 * @afenda/api-kit — Per-tenant rate limiting preHandler.
 *
 * In-memory sliding window rate limiter keyed by tenant ID
 * from req.authUser (NOT from headers).
 *
 * For production multi-instance deployments, replace with a
 * Redis-backed implementation via IRateLimitStore.
 */
import type { FastifyInstance } from 'fastify/types/instance.js';
import type { FastifyRequest } from 'fastify/types/request.js';
import type { FastifyReply } from 'fastify/types/reply.js';

export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
}

/**
 * Port for rate limit storage — allows swapping in Redis
 * without changing the guard logic.
 */
export interface IRateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }>;
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
 * Reads tenant ID from req.authUser (set by auth middleware).
 */
export function rateLimitGuard(config?: Partial<RateLimitConfig>) {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = (req as FastifyRequest & { authUser?: { tenantId?: string } }).authUser?.tenantId;
    if (!tenantId) return; // auth middleware handles missing auth

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
 * Registers the rate limit guard as a global preHandler on the Fastify instance.
 */
export function registerGlobalRateLimit(app: FastifyInstance, config?: Partial<RateLimitConfig>): void {
  app.addHook('preHandler', rateLimitGuard(config));
}

/**
 * Clears all rate limit state. Useful for testing.
 */
export function resetRateLimitState(): void {
  tenantWindows.clear();
}
