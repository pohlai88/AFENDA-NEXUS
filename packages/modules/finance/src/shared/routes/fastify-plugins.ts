import type { FastifyInstance, FastifyError } from 'fastify';

function isZodError(e: unknown): e is Error & { issues: unknown[] } {
  return (
    e instanceof Error &&
    e.name === 'ZodError' &&
    'issues' in e &&
    Array.isArray((e as Record<string, unknown>).issues)
  );
}

/**
 * Registers a Fastify error handler that maps ZodError to 400
 * and handles BigInt serialization in responses.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, _req, reply) => {
    // Zod validation errors (thrown by .parse())
    if (isZodError(error)) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION',
          message: 'Request validation failed',
          issues: error.issues,
        },
      });
    }

    // Fastify validation errors (from schema)
    if ('validation' in error && (error as FastifyError).validation) {
      return reply.status(400).send({
        error: { code: 'VALIDATION', message: error.message },
      });
    }

    // Default 500
    return reply.status(500).send({
      error: { code: 'INTERNAL', message: 'Internal server error' },
    });
  });
}

/**
 * Registers a preHandler hook that validates the x-tenant-id header
 * is present and non-empty on every request. Rejects with 400 if missing.
 */
export function registerTenantGuard(app: FastifyInstance): void {
  app.addHook('preHandler', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId || (typeof tenantId === 'string' && tenantId.trim() === '')) {
      return reply.status(400).send({
        error: { code: 'MISSING_TENANT', message: 'x-tenant-id header is required' },
      });
    }
  });
}

/**
 * Registers a custom JSON serializer that handles BigInt values
 * by converting them to strings.
 */
export function registerBigIntSerializer(app: FastifyInstance): void {
  app.setReplySerializer((payload) => {
    return JSON.stringify(payload, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  });
}
