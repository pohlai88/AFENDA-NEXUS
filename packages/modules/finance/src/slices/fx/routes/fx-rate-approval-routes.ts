import type { FastifyInstance } from 'fastify';
import { IdParamSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';

export function registerFxRateApprovalRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /fx-rates/:id/approve
  app.post(
    '/fx-rates/:id/approve',
    { preHandler: [requirePermission(policy, 'fx:manage')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return reply.status(400).send({ error: 'x-user-id header required' });

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.fxRateApprovalRepo.approve(id, userId);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /fx-rates/:id/reject
  app.post(
    '/fx-rates/:id/reject',
    { preHandler: [requirePermission(policy, 'fx:manage')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      if (!userId) return reply.status(400).send({ error: 'x-user-id header required' });

      const { reason } = (req.body ?? {}) as { reason?: string };

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.fxRateApprovalRepo.reject(id, userId, reason ?? '');
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /fx-rates/:id/approval — get approval status
  app.get(
    '/fx-rates/:id/approval',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.fxRateApprovalRepo.findByRateId(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
