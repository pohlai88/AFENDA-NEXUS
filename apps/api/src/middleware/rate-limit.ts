/**
 * GAP-15: Per-tenant rate limiting middleware.
 *
 * Redis-backed sliding-window rate limiter keyed by tenant ID.
 * Falls back to in-memory if REDIS_URL is not configured.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';

interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly redisUrl?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 200,
  windowMs: 60_000,
};

export async function rateLimitPlugin(
  app: FastifyInstance,
  config: Partial<RateLimitConfig> = {}
): Promise<void> {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const redisUrl = config.redisUrl ?? process.env.REDIS_URL;

  let redis: Redis | null = null;
  if (redisUrl) {
    redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
    try {
      await redis.connect();
    } catch {
      redis = null;
    }
  }

  // In-memory fallback
  const memWindows = new Map<string, { count: number; resetAt: number }>();
  if (!redis) {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, win] of memWindows) {
        if (win.resetAt <= now) memWindows.delete(key);
      }
    }, 5 * 60_000);
    app.addHook('onClose', () => clearInterval(cleanupInterval));
  }

  app.addHook('onClose', async () => {
    if (redis) await redis.quit().catch(() => { });
  });

  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.url.startsWith('/health')) return;

    const tenantId = (req as FastifyRequest & { authUser?: { tenantId?: string } }).authUser?.tenantId;
    if (!tenantId) return;

    const windowSec = Math.ceil(windowMs / 1000);
    let count: number;
    let resetSeconds: number;

    if (redis) {
      const key = `ratelimit:${tenantId}`;
      const multi = redis.multi();
      multi.incr(key);
      multi.ttl(key);
      const results = await multi.exec();
      count = (results?.[0]?.[1] as number) ?? 1;
      const ttl = (results?.[1]?.[1] as number) ?? -1;
      if (ttl === -1) {
        await redis.expire(key, windowSec);
        resetSeconds = windowSec;
      } else {
        resetSeconds = ttl;
      }
    } else {
      const now = Date.now();
      let win = memWindows.get(tenantId);
      if (!win || win.resetAt <= now) {
        win = { count: 0, resetAt: now + windowMs };
        memWindows.set(tenantId, win);
      }
      win.count++;
      count = win.count;
      resetSeconds = Math.ceil((win.resetAt - now) / 1000);
    }

    const remaining = Math.max(0, maxRequests - count);
    reply.header('RateLimit-Limit', maxRequests);
    reply.header('RateLimit-Remaining', remaining);
    reply.header('RateLimit-Reset', resetSeconds);

    if (count > maxRequests) {
      reply.header('Retry-After', resetSeconds);
      return reply.status(429).send({
        error: {
          code: 'RATE_LIMIT',
          message: `Rate limit exceeded: ${maxRequests} requests per ${windowSec}s`,
        },
      });
    }
  });
}
