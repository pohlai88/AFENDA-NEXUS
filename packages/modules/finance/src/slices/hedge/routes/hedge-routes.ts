import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerHedgeRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/hedge-relationships',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.hedgeRelationshipRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/hedge-relationships/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const hedge = await deps.hedgeRelationshipRepo.findById(req.params.id);
        if (!hedge) return reply.status(404).send({ error: 'Hedge relationship not found' });
        return hedge;
      });
    }
  );

  app.post(
    '/hedge-relationships',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.hedgeRelationshipRepo.create(tenantId, body as never);
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/hedge-relationships/:id/effectiveness-tests',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.hedgeEffectivenessTestRepo.findByRelationship(req.params.id);
      });
    }
  );

  app.post<{ Params: IdParam }>(
    '/hedge-relationships/:id/effectiveness-tests',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.hedgeEffectivenessTestRepo.create(tenantId, {
          hedgeRelationshipId: req.params.id,
          ...body,
        } as never);
      });
    }
  );
}
