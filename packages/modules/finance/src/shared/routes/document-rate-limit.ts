/**
 * Cost-based rate limiting for document uploads (Plan §8).
 * Token bucket per tenant: tokens = bytes uploaded.
 * In-memory; for production use Redis-backed store.
 */
import type { FastifyRequest, FastifyReply } from 'fastify';

const DEFAULT_MAX_BYTES_PER_WINDOW = 100 * 1024 * 1024; // 100MB
const DEFAULT_WINDOW_MS = 60_000; // 1 minute

interface TenantUsage {
  bytes: number;
  windowStart: number;
}

const tenantUsage = new Map<string, TenantUsage>();

function getOrCreateEntry(tenantId: string, now: number, windowMs: number): TenantUsage {
  let entry = tenantUsage.get(tenantId);
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { bytes: 0, windowStart: now };
    tenantUsage.set(tenantId, entry);
  }
  return entry;
}

/**
 * PreHandler: reject if adding contentLength would exceed tenant's byte quota.
 * Call consumeDocumentUploadBytes after successful upload to record usage.
 */
export function documentUploadRateLimitGuard(config?: {
  maxBytesPerWindow?: number;
  windowMs?: number;
}) {
  const maxBytes = config?.maxBytesPerWindow ?? DEFAULT_MAX_BYTES_PER_WINDOW;
  const windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS;

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = (req as FastifyRequest & { authUser?: { tenantId?: string } }).authUser
      ?.tenantId;
    if (!tenantId) return;

    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
    if (contentLength <= 0) return;

    const now = Date.now();
    const entry = getOrCreateEntry(tenantId, now, windowMs);

    if (entry.bytes + contentLength > maxBytes) {
      reply.header('Retry-After', Math.ceil(windowMs / 1000).toString());
      return reply.status(429).send({
        error: {
          code: 'RATE_LIMITED',
          message: `Document upload quota exceeded. Max ${maxBytes / 1024 / 1024}MB per ${windowMs / 1000}s per tenant`,
        },
      });
    }

    entry.bytes += contentLength;
  };
}

/**
 * Clears document rate limit state. Useful for testing.
 */
export function resetDocumentRateLimitState(): void {
  tenantUsage.clear();
}

/** Request-count rate limit for presign endpoints (Plan §8). */
const DEFAULT_PRESIGN_REQUESTS_PER_WINDOW = 60;
const PRESIGN_WINDOW_MS = 60_000;

interface PresignUsage {
  count: number;
  windowStart: number;
}

const presignUsage = new Map<string, PresignUsage>();

function getOrCreatePresignEntry(tenantId: string, now: number, windowMs: number): PresignUsage {
  let entry = presignUsage.get(tenantId);
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { count: 0, windowStart: now };
    presignUsage.set(tenantId, entry);
  }
  return entry;
}

/**
 * PreHandler: reject if tenant exceeds presign request quota per window.
 */
export function documentPresignRateLimitGuard(config?: {
  maxRequestsPerWindow?: number;
  windowMs?: number;
}) {
  const maxRequests = config?.maxRequestsPerWindow ?? DEFAULT_PRESIGN_REQUESTS_PER_WINDOW;
  const windowMs = config?.windowMs ?? PRESIGN_WINDOW_MS;

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const tenantId = (req as FastifyRequest & { authUser?: { tenantId?: string } }).authUser
      ?.tenantId;
    if (!tenantId) return;

    const now = Date.now();
    const entry = getOrCreatePresignEntry(tenantId, now, windowMs);

    if (entry.count >= maxRequests) {
      reply.header('Retry-After', Math.ceil(windowMs / 1000).toString());
      return reply.status(429).send({
        error: {
          code: 'RATE_LIMITED',
          message: `Presign quota exceeded. Max ${maxRequests} requests per ${windowMs / 1000}s per tenant`,
        },
      });
    }

    entry.count += 1;
  };
}

/**
 * Clears presign rate limit state. Useful for testing.
 */
export function resetPresignRateLimitState(): void {
  presignUsage.clear();
}
