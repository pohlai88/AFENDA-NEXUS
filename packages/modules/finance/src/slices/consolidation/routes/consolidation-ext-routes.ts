import type { FastifyInstance } from 'fastify';
import { EquityMethodBodySchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { updateOwnership } from '../services/update-ownership.js';
import { computeEquityMethod } from '../calculators/equity-method.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerConsolidationExtRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // ─── Equity Method (IAS 28) ───────────────────────────────────────────────

  app.post(
    '/consolidation/equity-method',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { associates } = EquityMethodBodySchema.parse(req.body);
      try {
        const { result } = computeEquityMethod(associates);
        return reply.send(result);
      } catch (e) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION', message: (e as Error).message } });
      }
    }
  );

  // ─── Group Entities ─────────────────────────────────────────────────────

  app.get(
    '/group-entities',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.groupEntityRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: { id: string } }>(
    '/group-entities/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const entity = await deps.groupEntityRepo.findById(req.params.id);
        if (!entity) return reply.status(404).send({ error: 'Group entity not found' });
        return entity;
      });
    }
  );

  app.post(
    '/group-entities',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.groupEntityRepo.create(tenantId, {
          companyId: body.companyId as string,
          name: body.name as string,
          entityType: body.entityType as 'PARENT' | 'SUBSIDIARY' | 'ASSOCIATE' | 'JOINT_VENTURE',
          parentEntityId: (body.parentEntityId as string) ?? null,
          baseCurrency: body.baseCurrency as string,
          countryCode: body.countryCode as string,
        });
      });
    }
  );

  // ─── Ownership Records ──────────────────────────────────────────────────

  app.get(
    '/ownership-records',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.ownershipRecordRepo.findAll();
        return { data: list };
      });
    }
  );

  app.post(
    '/ownership-records',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await updateOwnership(
          {
            tenantId,
            userId,
            parentEntityId: body.parentEntityId as string,
            childEntityId: body.childEntityId as string,
            newOwnershipPctBps: body.ownershipPctBps as number,
            newVotingPctBps: body.votingPctBps as number,
            effectiveDate: new Date(body.effectiveDate as string),
            acquisitionCost: BigInt(body.acquisitionCost as string),
            currencyCode: body.currencyCode as string,
          },
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return result.value;
      });
    }
  );

  // ─── Goodwill ───────────────────────────────────────────────────────────

  app.get('/goodwills', { preHandler: [requirePermission(policy, 'report:read')] }, async (req) => {
    const { tenantId, userId } = extractIdentity(req);
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.goodwillRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>(
    '/goodwills/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const gw = await deps.goodwillRepo.findById(req.params.id);
        if (!gw) return reply.status(404).send({ error: 'Goodwill not found' });
        return gw;
      });
    }
  );
}
