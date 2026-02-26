import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { submitExpenseClaim } from '../services/submit-expense-claim.js';

export function registerExpenseRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/expense-claims',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.expenseClaimRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/expense-claims/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const claim = await deps.expenseClaimRepo.findById(req.params.id);
        if (!claim) return reply.status(404).send({ error: 'Expense claim not found' });
        return claim;
      });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/expense-claims/:id/lines',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const lines = await deps.expenseClaimRepo.findLinesByClaim(req.params.id);
        return { data: lines };
      });
    }
  );

  app.post<{ Params: { id: string } }>(
    '/expense-claims/:id/submit',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await submitExpenseClaim({ tenantId, userId, claimId: req.params.id }, deps);
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return result.value;
      });
    }
  );

  app.get(
    '/expense-policies',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.expensePolicyRepo.findAll();
        return { data: list };
      });
    }
  );
}
