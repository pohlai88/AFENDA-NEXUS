import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import type { CreateTaxCodeInput } from '../ports/tax-code-repo.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerTaxCodeRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get('/tax/codes', { preHandler: [requirePermission(policy, 'report:read')] }, async (req) => {
    const { tenantId, userId } = extractIdentity(req);
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const codes = await deps.taxCodeRepo.findAll();
      return { data: codes };
    });
  });

  app.get<{ Params: IdParam }>(
    '/tax/codes/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const code = await deps.taxCodeRepo.findById(req.params.id);
        if (!code) return reply.status(404).send({ error: 'Tax code not found' });
        return code;
      });
    }
  );

  app.post(
    '/tax/codes',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const code = await deps.taxCodeRepo.create(tenantId, body as unknown as CreateTaxCodeInput);
        return reply.status(201).send(code);
      });
    }
  );
}
