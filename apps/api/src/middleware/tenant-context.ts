import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { runWithContext, getContext } from '@afenda/platform';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

declare module 'fastify' {
  interface FastifyRequest {
    tenantContext: { tenantId: string; userId: string };
    correlationId: string;
  }
}

/**
 * Fastify plugin that extracts and validates tenant context from headers.
 *
 * - x-tenant-id (required on all requests)
 * - x-user-id (required on write methods: POST/PUT/PATCH/DELETE)
 * - x-correlation-id (optional — generated if missing)
 *
 * Decorates `request.tenantContext` and `request.correlationId` for downstream handlers.
 * Wraps the entire request lifecycle in AsyncLocalStorage via `runWithContext`
 * so every log line automatically includes correlation_id, tenant_id, user_id.
 * Health routes (/health*) are excluded from tenant validation but still get correlation IDs.
 */
export async function tenantContextPlugin(app: FastifyInstance): Promise<void> {
  app.decorateRequest('tenantContext', undefined as never);
  app.decorateRequest('correlationId', '');

  // onRequest runs first — establishes AsyncLocalStorage scope + correlation ID
  app.addHook('onRequest', (req, _reply, done) => {
    const correlationId = (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
    req.correlationId = correlationId;

    // Run the rest of the request lifecycle inside AsyncLocalStorage
    // Context is populated with correlationId immediately; tenantId/userId added in preHandler
    runWithContext({ correlationId, requestId: req.id }, () => done());
  });

  // onSend — echo correlation ID back to caller
  app.addHook('onSend', async (req, reply) => {
    reply.header('x-correlation-id', req.correlationId);
  });

  // preHandler — validate tenant headers (after onRequest has set up context)
  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    // Skip health endpoints
    if (req.url.startsWith('/health')) return;

    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    if (!tenantId || !UUID_RE.test(tenantId)) {
      return reply.status(401).send({
        error: { code: 'MISSING_TENANT', message: 'x-tenant-id header required (UUID)' },
      });
    }

    const userId = req.headers['x-user-id'] as string | undefined;
    if (WRITE_METHODS.has(req.method) && (!userId || !UUID_RE.test(userId))) {
      return reply.status(401).send({
        error: {
          code: 'MISSING_USER',
          message: 'x-user-id header required for write operations (UUID)',
        },
      });
    }

    req.tenantContext = { tenantId, userId: userId ?? 'anonymous' };

    // Enrich the ALS context with tenant/user info (mixin picks this up for all subsequent logs)
    const ctx = getContext();
    if (ctx) {
      ctx.tenantId = tenantId;
      ctx.userId = userId;
    }
  });
}
