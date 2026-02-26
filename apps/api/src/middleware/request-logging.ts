/**
 * Fastify request/response logging plugin.
 *
 * Logs structured JSON for every request (method, url, correlationId)
 * and response (statusCode, duration_ms). Uses the platform Logger
 * so all log lines inherit AsyncLocalStorage context automatically.
 */
import type { FastifyInstance } from 'fastify';
import type { Logger } from '@afenda/platform';

export function requestLoggingPlugin(logger: Logger) {
  return async function plugin(app: FastifyInstance): Promise<void> {
    app.addHook('onRequest', async (req) => {
      // Attach start time for duration calculation
      (req as unknown as Record<string, unknown>).__startTime = process.hrtime.bigint();

      logger.info('request started', {
        method: req.method,
        url: req.url,
        correlationId: req.correlationId,
      });
    });

    app.addHook('onResponse', async (req, reply) => {
      const start = (req as unknown as Record<string, unknown>).__startTime as bigint | undefined;
      const durationMs = start ? Number(process.hrtime.bigint() - start) / 1_000_000 : undefined;

      const level = reply.statusCode >= 500 ? 'error' : reply.statusCode >= 400 ? 'warn' : 'info';

      logger[level]('request completed', {
        method: req.method,
        url: req.url,
        statusCode: reply.statusCode,
        duration_ms: durationMs ? Math.round(durationMs * 100) / 100 : undefined,
        correlationId: req.correlationId,
      });
    });
  };
}
