import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerProvisionRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/provisions',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.provisionRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/provisions/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const provision = await deps.provisionRepo.findById(req.params.id);
        if (!provision) return reply.status(404).send({ error: 'Provision not found' });
        return provision;
      });
    }
  );

  app.post(
    '/provisions',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.provisionRepo.create(tenantId, body as never);
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/provisions/:id/movements',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.provisionMovementRepo.findByProvision(req.params.id);
      });
    }
  );
}
