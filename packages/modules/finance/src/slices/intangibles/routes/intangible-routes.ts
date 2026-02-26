import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerIntangibleRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/intangible-assets',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.intangibleAssetRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/intangible-assets/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const asset = await deps.intangibleAssetRepo.findById(req.params.id);
        if (!asset) return reply.status(404).send({ error: 'Intangible asset not found' });
        return asset;
      });
    }
  );

  app.post(
    '/intangible-assets',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.intangibleAssetRepo.create(tenantId, body as never);
      });
    }
  );
}
