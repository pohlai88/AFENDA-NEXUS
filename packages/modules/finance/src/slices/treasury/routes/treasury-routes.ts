import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';

export function registerTreasuryRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/cash-forecasts',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return { data: await deps.cashForecastRepo.findAll() };
      });
    }
  );

  app.post(
    '/cash-forecasts',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.cashForecastRepo.create(tenantId, body as never);
      });
    }
  );

  app.get('/covenants', { preHandler: [requirePermission(policy, 'report:read')] }, async (req) => {
    const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
    const userId = (req.headers as Record<string, string>)['x-user-id']!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return { data: await deps.covenantRepo.findAll() };
    });
  });

  app.post(
    '/covenants',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.covenantRepo.create(tenantId, body as never);
      });
    }
  );

  app.get('/ic-loans', { preHandler: [requirePermission(policy, 'report:read')] }, async (req) => {
    const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
    const userId = (req.headers as Record<string, string>)['x-user-id']!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return { data: await deps.icLoanRepo.findAll() };
    });
  });

  app.post('/ic-loans', { preHandler: [requirePermission(policy, 'ic:create')] }, async (req) => {
    const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
    const userId = (req.headers as Record<string, string>)['x-user-id']!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.icLoanRepo.create(tenantId, body as never);
    });
  });
}
