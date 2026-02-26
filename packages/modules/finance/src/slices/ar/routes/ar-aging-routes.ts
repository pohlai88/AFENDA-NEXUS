import type { FastifyInstance } from 'fastify';
import { ArAgingQuerySchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { getArAging } from '../services/get-ar-aging.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerArAgingRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // GET /ar/aging — AR aging report
  app.get(
    '/ar/aging',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = ArAgingQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getArAging(
          {
            tenantId,
            asOfDate: query.asOfDate ? new Date(query.asOfDate) : undefined,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
