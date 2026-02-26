import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  PaginationSchema,
  OptionalReasonBodySchema,
  CloseYearSchema,
  FiscalYearBodySchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission, requireSoD } from '../../../shared/routes/authorization-guard.js';
import { closePeriod } from '../services/close-period.js';
import { lockPeriod } from '../services/lock-period.js';
import { reopenPeriod } from '../services/reopen-period.js';
import { closeYear } from '../services/close-year.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { generateFiscalYear } from '../calculators/fiscal-year-generator.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerPeriodRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /periods/generate-fiscal-year — generate period definitions for a fiscal year
  app.post(
    '/periods/generate-fiscal-year',
    { preHandler: [requirePermission(policy, 'admin:all')] },
    async (req, reply) => {
      const input = FiscalYearBodySchema.parse(req.body);
      try {
        const { result } = generateFiscalYear(input);
        return reply.send(result);
      } catch (e) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION', message: (e as Error).message } });
      }
    }
  );

  // GET /periods — paginated list
  app.get(
    '/periods',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const pagination = PaginationSchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.periodRepo.findAll(pagination);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /periods/:id
  app.get(
    '/periods/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.periodRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /periods/:id/close — requires authenticated user
  app.post(
    '/periods/:id/close',
    {
      preHandler: [
        requirePermission(policy, 'period:close'),
        requireSoD(policy, 'period:close', 'fiscalPeriod'),
      ],
    },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const { reason } = OptionalReasonBodySchema.parse(req.body ?? {});

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return closePeriod(
          {
            tenantId,
            periodId: id,
            userId,
            reason,
            correlationId: req.headers['x-correlation-id'] as string | undefined,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /periods/:id/lock — requires authenticated user, period must be CLOSED
  app.post(
    '/periods/:id/lock',
    { preHandler: [requirePermission(policy, 'period:lock')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const { reason } = OptionalReasonBodySchema.parse(req.body ?? {});

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return lockPeriod(
          {
            tenantId,
            periodId: id,
            userId,
            reason,
            correlationId: req.headers['x-correlation-id'] as string | undefined,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /periods/:id/reopen — requires authenticated user, period must be CLOSED (not LOCKED)
  app.post(
    '/periods/:id/reopen',
    {
      preHandler: [
        requirePermission(policy, 'period:reopen'),
        requireSoD(policy, 'period:reopen', 'fiscalPeriod'),
      ],
    },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const { reason } = OptionalReasonBodySchema.parse(req.body ?? {});

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return reopenPeriod(
          {
            tenantId,
            periodId: id,
            userId,
            reason,
            correlationId: req.headers['x-correlation-id'] as string | undefined,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /periods/close-year — year-end close with evidence pack
  app.post(
    '/periods/close-year',
    { preHandler: [requirePermission(policy, 'year:close')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CloseYearSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return closeYear(
          {
            tenantId,
            ledgerId: body.ledgerId,
            fiscalYear: body.fiscalYear,
            retainedEarningsAccountId: body.retainedEarningsAccountId,
            periodIds: body.periodIds,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
