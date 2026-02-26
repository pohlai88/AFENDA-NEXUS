import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import type { CreateTaxRateInput } from '../ports/tax-rate-repo.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerTaxRateRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get('/tax/rates', { preHandler: [requirePermission(policy, 'report:read')] }, async (req) => {
    const { tenantId, userId } = extractIdentity(req);
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const rates = await deps.taxRateRepo.findAll();
      return { data: rates };
    });
  });

  app.get<{ Params: IdParam }>(
    '/tax/rates/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const rate = await deps.taxRateRepo.findById(req.params.id);
        if (!rate) return reply.status(404).send({ error: 'Tax rate not found' });
        return rate;
      });
    }
  );

  app.post(
    '/tax/rates',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const rate = await deps.taxRateRepo.create(tenantId, body as unknown as CreateTaxRateInput);
        return reply.status(201).send(rate);
      });
    }
  );
}
