import type { FastifyInstance } from 'fastify';
import { IdParamSchema, ClassificationRuleQuerySchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import type { ReportingStandard } from '../../hub/entities/classification-rule.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';

export function registerClassificationRuleRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // GET /classification-rules?standard=IFRS&version=1
  app.get(
    '/classification-rules',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
      const { standard, version } = ClassificationRuleQuerySchema.parse(req.query);

      if (!standard) {
        // List all rule sets
        const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
          return deps.classificationRuleRepo.findAll({ page: 1, limit: 100 });
        });

        return result.ok
          ? reply.send(result.value)
          : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      }

      // Find by standard (optionally versioned)
      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.classificationRuleRepo.findByStandard(standard as ReportingStandard, version);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /classification-rules/:id — single rule
  app.get(
    '/classification-rules/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.classificationRuleRepo.findRuleById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
