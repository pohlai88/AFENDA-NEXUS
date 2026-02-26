/**
 * Health check routes — §14 compliance.
 *
 * GET /health       — Liveness (always 200 if process is up)
 * GET /health/ready — Readiness (DB reachable, migrations applied)
 */
import type { FastifyInstance } from 'fastify';

export type HealthCheck = () => Promise<void>;

export async function registerHealthRoutes(
  app: FastifyInstance,
  dbHealthCheck: HealthCheck
): Promise<void> {
  app.get('/health', async (_req, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, reply) => {
    try {
      await dbHealthCheck();
      return reply.status(200).send({ status: 'ready', checks: { db: 'ok' } });
    } catch (err) {
      return reply.status(503).send({
        status: 'not_ready',
        checks: { db: 'error', detail: String(err) },
      });
    }
  });
}
