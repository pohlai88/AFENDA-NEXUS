import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';

export function registerLeaseRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get('/leases', { preHandler: [requirePermission(policy, 'report:read')] }, async (req) => {
    const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
    const userId = (req.headers as Record<string, string>)['x-user-id']!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.leaseContractRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>(
    '/leases/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const lease = await deps.leaseContractRepo.findById(req.params.id);
        if (!lease) return reply.status(404).send({ error: 'Lease not found' });
        return lease;
      });
    }
  );

  app.post(
    '/leases',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.leaseContractRepo.create(tenantId, body as never);
      });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/leases/:id/schedule',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.leaseScheduleRepo.findByLease(req.params.id);
      });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/leases/:id/modifications',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const tenantId = (req.headers as Record<string, string>)['x-tenant-id']!;
      const userId = (req.headers as Record<string, string>)['x-user-id']!;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.leaseModificationRepo.findByLease(req.params.id);
      });
    }
  );
}
