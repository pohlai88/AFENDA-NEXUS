import type { FastifyInstance } from 'fastify';
import { IdParamSchema, PaginationSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';

export function registerIcAgreementRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // GET /ic-agreements — paginated list
  app.get(
    '/ic-agreements',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
      const pagination = PaginationSchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.icAgreementRepo.findAll(pagination);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ic-agreements/:id
  app.get(
    '/ic-agreements/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.icAgreementRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
