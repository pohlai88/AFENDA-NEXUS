import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { placeCreditHold, releaseCreditHold } from '../services/credit-hold-release.js';

export function registerCreditRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/credit-limits',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.creditLimitRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/credit-limits/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const limit = await deps.creditLimitRepo.findById(req.params.id);
        if (!limit) return reply.status(404).send({ error: 'Credit limit not found' });
        return limit;
      });
    }
  );

  app.post<{ Params: { customerId: string } }>(
    '/credit-limits/:customerId/hold',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await placeCreditHold(
          {
            tenantId,
            userId,
            customerId: req.params.customerId,
            reason: (body.reason as string) ?? '',
          },
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return result.value;
      });
    }
  );

  app.post<{ Params: { customerId: string } }>(
    '/credit-limits/:customerId/release',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await releaseCreditHold(
          {
            tenantId,
            userId,
            customerId: req.params.customerId,
            reason: (body.reason as string) ?? '',
          },
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return result.value;
      });
    }
  );

  app.get<{ Params: { customerId: string } }>(
    '/credit-reviews/:customerId',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const reviews = await deps.creditReviewRepo.findByCustomer(req.params.customerId);
        return { data: reviews };
      });
    }
  );
}
