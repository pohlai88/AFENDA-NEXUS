import type { FastifyInstance } from 'fastify';
import {
  BudgetEntryListQuerySchema,
  UpsertBudgetEntrySchema,
  BudgetVarianceQuerySchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission, requireSoD } from '../../../shared/routes/authorization-guard.js';
import { getBudgetVariance } from '../services/get-budget-variance.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerBudgetRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /budget-entries — upsert budget entry
  app.post(
    '/budget-entries',
    {
      preHandler: [
        requirePermission(policy, 'budget:write'),
        requireSoD(policy, 'budget:write', 'budgetControl'),
      ],
    },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const body = UpsertBudgetEntrySchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const upsertResult = await deps.budgetRepo.upsert({
          tenantId,
          companyId: body.companyId,
          ledgerId: body.ledgerId,
          accountId: body.accountId,
          periodId: body.periodId,
          budgetAmount: BigInt(body.budgetAmount),
        });

        // Cross-entity SoD: budget:write ↔ journal:post scoped to fiscal period
        await deps.sodActionLogRepo?.logAction({
          tenantId,
          entityType: 'budgetControl',
          entityId: body.periodId,
          actorId: userId,
          action: 'budget:write',
        });

        return upsertResult;
      });

      return reply.status(201).send(result);
    }
  );

  // GET /budget-entries?ledgerId=&periodId= — list
  app.get(
    '/budget-entries',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const { ledgerId, periodId, page, limit } = BudgetEntryListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.budgetRepo.findByLedgerAndPeriod(ledgerId, periodId, { page, limit });
      });

      return reply.send(result);
    }
  );

  // GET /budget-variance?ledgerId=&periodId= — variance report
  app.get(
    '/budget-variance',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = BudgetVarianceQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getBudgetVariance(query, {
          budgetRepo: deps.budgetRepo,
          balanceRepo: deps.balanceRepo,
          accountRepo: deps.accountRepo,
          ledgerRepo: deps.ledgerRepo,
        });
      });

      if (!result.ok) {
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      }
      return reply.send(result.value);
    }
  );
}
