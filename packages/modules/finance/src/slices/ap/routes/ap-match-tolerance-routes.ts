import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreateMatchToleranceSchema,
  UpdateMatchToleranceSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerApMatchToleranceRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // GET /ap/match-tolerances — list all rules for tenant
  app.get(
    '/ap/match-tolerances',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const rules = await deps.matchToleranceRepo.findByTenant(tenantId);
        return rules;
      });

      return reply.send(result);
    }
  );

  // POST /ap/match-tolerances — create rule
  app.post(
    '/ap/match-tolerances',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateMatchToleranceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.matchToleranceRepo.create({
          tenantId,
          scope: body.scope,
          scopeEntityId: body.scopeEntityId ?? null,
          companyId: body.companyId ?? null,
          toleranceBps: body.toleranceBps,
          quantityTolerancePercent: body.quantityTolerancePercent,
          autoHold: body.autoHold,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/match-tolerances/:id
  app.get(
    '/ap/match-tolerances/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.matchToleranceRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // PATCH /ap/match-tolerances/:id
  app.patch(
    '/ap/match-tolerances/:id',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = UpdateMatchToleranceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.matchToleranceRepo.update(id, {
          toleranceBps: body.toleranceBps,
          quantityTolerancePercent: body.quantityTolerancePercent,
          autoHold: body.autoHold,
          isActive: body.isActive,
        });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
