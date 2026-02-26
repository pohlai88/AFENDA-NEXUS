/**
 * Fastify route handlers for journal endpoints.
 * This is the ONLY place in the finance module that may import fastify.
 * Routes receive FinanceRuntime — they NEVER import @afenda/db or drizzle-orm.
 */
import type { FastifyInstance } from 'fastify';
import {
  CreateJournalSchema,
  IdParamSchema,
  JournalListQuerySchema,
  ReasonBodySchema,
  OpeningBalanceBodySchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission, requireSoD } from '../../../shared/routes/authorization-guard.js';
import { createJournal } from '../services/create-journal.js';
import { postJournal } from '../services/post-journal.js';
import { reverseJournal } from '../services/reverse-journal.js';
import { voidJournal } from '../services/void-journal.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { validateOpeningBalances } from '../calculators/opening-balance-import.js';

export function registerJournalRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /journals/opening-balance — validate and prepare opening balance import
  app.post(
    '/journals/opening-balance',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const input = OpeningBalanceBodySchema.parse(req.body);
      try {
        const { result } = validateOpeningBalances(input);
        return reply.send(result);
      } catch (e) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION', message: (e as Error).message } });
      }
    }
  );

  // POST /journals — create draft
  app.post(
    '/journals',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const body = CreateJournalSchema.parse(req.body);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return createJournal(
          {
            tenantId,
            userId,
            ledgerId: body.ledgerId,
            description: body.description,
            postingDate: new Date(body.date),
            lines: body.lines.map((l) => ({
              accountCode: l.accountCode,
              // eslint-disable-next-line no-restricted-syntax -- HTTP boundary: dollars→cents, not FX
              debit: BigInt(Math.round(l.debit * 100)),
              // eslint-disable-next-line no-restricted-syntax -- HTTP boundary: dollars→cents, not FX
              credit: BigInt(Math.round(l.credit * 100)),
              currency: l.currency,
              description: l.description,
            })),
          },
          deps
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /journals/:id/post — post a draft (idempotent)
  app.post(
    '/journals/:id/post',
    {
      preHandler: [
        requirePermission(policy, 'journal:post'),
        requireSoD(policy, 'journal:post', 'journal'),
      ],
    },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return postJournal(
          {
            tenantId,
            userId,
            journalId: id,
            idempotencyKey,
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

  // POST /journals/:id/reverse — reverse a posted journal (idempotent)
  app.post(
    '/journals/:id/reverse',
    {
      preHandler: [
        requirePermission(policy, 'journal:reverse'),
        requireSoD(policy, 'journal:reverse', 'journal'),
      ],
    },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const { reason } = ReasonBodySchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return reverseJournal(
          {
            tenantId,
            userId,
            journalId: id,
            idempotencyKey,
            reason,
            correlationId: req.headers['x-correlation-id'] as string | undefined,
          },
          deps
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /journals/:id/void — void a draft journal
  app.post(
    '/journals/:id/void',
    { preHandler: [requirePermission(policy, 'journal:void')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const { reason } = ReasonBodySchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return voidJournal(
          {
            tenantId,
            journalId: id,
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

  // GET /journals — paginated list by period
  app.get(
    '/journals',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { periodId, status, page, limit } = JournalListQuerySchema.parse(req.query);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.journalRepo.findByPeriod(periodId, status, { page, limit });
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /journals/:id/audit — audit trail for a journal
  app.get(
    '/journals/:id/audit',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.journalAuditRepo.findByJournalId(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /journals/:id — get by ID (read — userId optional)
  app.get(
    '/journals/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.journalRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
