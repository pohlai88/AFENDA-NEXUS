import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerDeferredTaxRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/deferred-tax-items',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.deferredTaxItemRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/deferred-tax-items/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const item = await deps.deferredTaxItemRepo.findById(req.params.id);
        if (!item) return reply.status(404).send({ error: 'Deferred tax item not found' });
        return item;
      });
    }
  );

  app.post(
    '/deferred-tax-items',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.deferredTaxItemRepo.create(tenantId, body as never);
      });
    }
  );
}
