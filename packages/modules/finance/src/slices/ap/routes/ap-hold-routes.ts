import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreateApHoldSchema,
  ReleaseApHoldSchema,
  ApHoldListQueryWithDateRangeSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { applyHold } from '../services/apply-hold.js';
import { releaseHold } from '../services/release-hold.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerApHoldRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ap/holds — apply hold to invoice
  app.post(
    '/ap/holds',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateApHoldSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return applyHold(
          {
            tenantId,
            userId,
            invoiceId: body.invoiceId,
            holdType: body.holdType,
            holdReason: body.holdReason,
          },
          deps
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/holds — paginated list with filters
  app.get(
    '/ap/holds',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = ApHoldListQueryWithDateRangeSchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.apHoldRepo.findAll(query);
      });

      return reply.send(result);
    }
  );

  // GET /ap/holds/:id
  app.get(
    '/ap/holds/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.apHoldRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/invoices/:id/holds — holds for a specific invoice
  app.get(
    '/ap/invoices/:id/holds',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.apHoldRepo.findByInvoice(id);
      });

      return reply.send(result);
    }
  );

  // POST /ap/holds/:id/release — release a hold
  app.post(
    '/ap/holds/:id/release',
    { preHandler: [requirePermission(policy, 'journal:approve')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = ReleaseApHoldSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return releaseHold({ holdId: id, userId, releaseReason: body.releaseReason }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
