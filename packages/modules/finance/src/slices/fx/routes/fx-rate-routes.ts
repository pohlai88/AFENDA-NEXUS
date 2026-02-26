import type { FastifyInstance } from 'fastify';
import { FxRateQuerySchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';

export function registerFxRateRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // GET /fx-rates?from=USD&to=MYR&date=2025-01-15 — lookup FX rate
  app.get(
    '/fx-rates',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
      const { from, to, date } = FxRateQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.fxRateRepo.findRate(from, to, new Date(date));
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
