/**
 * @afenda/api-kit — Generic Fastify error handler and BigInt serializer.
 *
 * Moved from @afenda/finance/shared/routes/fastify-plugins.ts so that
 * every module can use these without depending on finance.
 */
import type { FastifyInstance } from 'fastify/types/instance.js';
import type { FastifyReply } from 'fastify/types/reply.js';
import type { FastifyRequest } from 'fastify/types/request.js';

interface FastifyError extends Error {
  code?: string;
  statusCode?: number;
  validation?: unknown;
}

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
 * and handles standard Fastify validation errors.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, _req: FastifyRequest, reply: FastifyReply) => {
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
 * Registers a custom JSON serializer that handles BigInt values
 * by converting them to strings.
 */
export function registerBigIntSerializer(app: FastifyInstance): void {
  app.setReplySerializer((payload: unknown) => {
    return JSON.stringify(payload, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  });
}
