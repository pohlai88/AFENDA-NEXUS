import type { FastifyInstance } from 'fastify';
import { IdParamSchema, RunDunningSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { runDunning } from '../services/run-dunning.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerArDunningRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ar/dunning — run dunning process
  app.post(
    '/ar/dunning',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = RunDunningSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return runDunning(
          {
            tenantId,
            userId,
            runDate: new Date(body.runDate),
          },
          deps
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ar/dunning/:id
  app.get('/ar/dunning/:id', async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.dunningRepo.findById(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
