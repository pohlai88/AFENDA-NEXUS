/**
 * GAP-15: Per-tenant rate limiting middleware.
 *
 * Simple sliding-window rate limiter keyed by tenant ID.
 * Uses in-memory storage — suitable for single-instance deployments.
 * For multi-instance, replace with Redis-backed store.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

interface RateLimitConfig {
  /** Max requests per window per tenant */
  readonly maxRequests: number;
  /** Window duration in milliseconds */
  readonly windowMs: number;
}

interface TenantWindow {
  count: number;
  resetAt: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 200,
  windowMs: 60_000, // 1 minute
};

export async function rateLimitPlugin(
  app: FastifyInstance,
  config: Partial<RateLimitConfig> = {},
): Promise<void> {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const windows = new Map<string, TenantWindow>();

  // Periodic cleanup of expired windows (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, win] of windows) {
      if (win.resetAt <= now) windows.delete(key);
    }
  }, 5 * 60_000);

  // Ensure cleanup stops when Fastify closes
  app.addHook("onClose", () => {
    clearInterval(cleanupInterval);
  });

  app.addHook("preHandler", async (req: FastifyRequest, reply: FastifyReply) => {
    // Skip health endpoints
    if (req.url.startsWith("/health")) return;

    const tenantId = req.headers["x-tenant-id"] as string | undefined;
    if (!tenantId) return; // Tenant guard will reject this separately

    const now = Date.now();
    let win = windows.get(tenantId);

    if (!win || win.resetAt <= now) {
      win = { count: 0, resetAt: now + windowMs };
      windows.set(tenantId, win);
    }

    win.count++;

    // Set rate limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
    const remaining = Math.max(0, maxRequests - win.count);
    const resetSeconds = Math.ceil((win.resetAt - now) / 1000);
    reply.header("RateLimit-Limit", maxRequests);
    reply.header("RateLimit-Remaining", remaining);
    reply.header("RateLimit-Reset", resetSeconds);

    if (win.count > maxRequests) {
      reply.header("Retry-After", resetSeconds);
      return reply.status(429).send({
        error: {
          code: "RATE_LIMIT",
          message: `Rate limit exceeded: ${maxRequests} requests per ${windowMs / 1000}s`,
        },
      });
    }
  });
}
