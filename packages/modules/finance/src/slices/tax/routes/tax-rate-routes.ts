import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import type { CreateTaxRateInput } from '../ports/tax-rate-repo.js';

export function registerTaxRateRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get('/tax/rates', { preHandler: [requirePermission(policy, 'report:read')] }, async (req) => {
    const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
    const userId = (req.headers as Record<string, string>)['x-user-id']!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const rates = await deps.taxRateRepo.findAll();
      return { data: rates };
    });
  });

  app.post(
    '/tax/rates',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req, reply) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const rate = await deps.taxRateRepo.create(
          tenantId,
          body as unknown as CreateTaxRateInput
        );
        return reply.status(201).send(rate);
      });
    }
  );
}
