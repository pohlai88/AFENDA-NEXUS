import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { aggregateTaxReturn } from '../services/aggregate-tax-return.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerTaxReturnRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/tax/returns',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const returns = await deps.taxReturnRepo.findAll();
        return { data: returns };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/tax/returns/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const taxReturn = await deps.taxReturnRepo.findById(req.params.id);
        if (!taxReturn) return reply.status(404).send({ error: 'Tax return not found' });
        return taxReturn;
      });
    }
  );

  app.post(
    '/tax/returns',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await aggregateTaxReturn(
          {
            tenantId,
            userId,
            taxType: body.taxType as string,
            jurisdictionCode: body.jurisdictionCode as string,
            periodStart: new Date(body.periodStart as string),
            periodEnd: new Date(body.periodEnd as string),
            entries: (body.entries as readonly unknown[]) ?? [],
            currencyCode: (body.currencyCode as string) ?? 'USD',
          } as Parameters<typeof aggregateTaxReturn>[0],
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return reply.status(201).send(result.value);
      });
    }
  );
}
