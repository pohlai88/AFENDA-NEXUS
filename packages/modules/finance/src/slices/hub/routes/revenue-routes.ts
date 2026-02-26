import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreateRevenueContractSchema,
  RecognizeRevenueSchema,
  PaginationSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { recognizeRevenue } from '../services/recognize-revenue.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';

export function registerRevenueRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /revenue-contracts — create
  app.post(
    '/revenue-contracts',
    { preHandler: [requirePermission(policy, 'revenue:create')] },
    async (req, reply) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const body = CreateRevenueContractSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.revenueContractRepo.create({
          tenantId,
          companyId: body.companyId,
          contractNumber: body.contractNumber,
          customerName: body.customerName,
          totalAmount: BigInt(body.totalAmount),
          currency: body.currency,
          recognitionMethod: body.recognitionMethod,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          deferredAccountId: body.deferredAccountId,
          revenueAccountId: body.revenueAccountId,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /revenue-contracts — list
  app.get(
    '/revenue-contracts',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
      const { page, limit } = PaginationSchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.revenueContractRepo.findAll({ page, limit });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /revenue-contracts/:id
  app.get(
    '/revenue-contracts/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.revenueContractRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /revenue-contracts/:id/milestones
  app.get(
    '/revenue-contracts/:id/milestones',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.revenueContractRepo.findMilestones(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /revenue-contracts/:id/recognize — recognize revenue for a period
  app.post(
    '/revenue-contracts/:id/recognize',
    { preHandler: [requirePermission(policy, 'revenue:recognize')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const body = RecognizeRevenueSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return recognizeRevenue(
          {
            tenantId,
            userId,
            contractId: id,
            periodId: body.periodId,
            ledgerId: body.ledgerId,
            idempotencyKey,
          },
          {
            revenueContractRepo: deps.revenueContractRepo,
            journalRepo: deps.journalRepo,
            ledgerRepo: deps.ledgerRepo,
            idempotencyStore: deps.idempotencyStore,
            outboxWriter: deps.outboxWriter,
            journalAuditRepo: deps.journalAuditRepo,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
