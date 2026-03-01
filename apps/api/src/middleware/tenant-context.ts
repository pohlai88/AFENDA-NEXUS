import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { runWithContext, getContext } from '@afenda/core';

declare module 'fastify' {
  interface FastifyRequest {
    tenantContext: { tenantId: string; userId: string };
    correlationId: string;
  }
}

/**
 * Fastify plugin: correlation ID + AsyncLocalStorage scope + tenant context.
 *
 * - x-correlation-id (optional — generated if missing)
 * - Wraps the request lifecycle in AsyncLocalStorage via `runWithContext`
 * - Populates `req.tenantContext` from `req.authUser` (set by auth middleware)
 *
 * Identity is NOT read from x-tenant-id / x-user-id headers.
 * Auth middleware is the single source of truth for identity.
 */
export async function tenantContextPlugin(app: FastifyInstance): Promise<void> {
  app.decorateRequest('tenantContext', undefined as never);
  app.decorateRequest('correlationId', '');

  // onRequest runs first — establishes AsyncLocalStorage scope + correlation ID
  app.addHook('onRequest', (req, _reply, done) => {
    const correlationId = (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
    req.correlationId = correlationId;

    // Run the rest of the request lifecycle inside AsyncLocalStorage
    runWithContext({ correlationId, requestId: req.id }, () => done());
  });

  // onSend — echo correlation ID back to caller
  app.addHook('onSend', async (req, reply) => {
    reply.header('x-correlation-id', req.correlationId);
  });

  // preHandler — populate tenantContext from authUser (after auth middleware has run)
  app.addHook('preHandler', async (req) => {
    // Skip health endpoints
    if (req.url.startsWith('/health')) return;

    const authUser = (req as typeof req & { authUser?: { tenantId?: string; userId?: string } }).authUser;
    const tenantId = authUser?.tenantId ?? '';
    const userId = authUser?.userId ?? 'anonymous';

    req.tenantContext = { tenantId, userId };

    // Enrich the ALS context with tenant/user info (mixin picks this up for all subsequent logs)
    const ctx = getContext();
    if (ctx) {
      ctx.tenantId = tenantId;
      ctx.userId = userId;
    }
  });
}
