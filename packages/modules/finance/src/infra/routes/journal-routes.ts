/**
 * Fastify route handlers for journal endpoints.
 * This is the ONLY place in the finance module that may import fastify.
 * Routes receive FinanceRuntime — they NEVER import @afenda/db or drizzle-orm.
 */
import type { FastifyInstance } from "fastify";
import { CreateJournalSchema, IdParamSchema, JournalListQuerySchema, ReasonBodySchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../app/ports/finance-runtime.js";
import { createJournal } from "../../app/services/create-journal.js";
import { postJournal } from "../../app/services/post-journal.js";
import { reverseJournal } from "../../app/services/reverse-journal.js";
import { voidJournal } from "../../app/services/void-journal.js";
import { mapErrorToStatus } from "./error-mapper.js";

export function registerJournalRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /journals — create draft
  app.post("/journals", async (req, reply) => {
    const body = CreateJournalSchema.parse(req.body);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;

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
        deps,
      );
    });

    return result.ok
      ? reply.status(201).send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /journals/:id/post — post a draft (idempotent)
  app.post("/journals/:id/post", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const idempotencyKey = req.headers["idempotency-key"] as string;

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return postJournal(
        { tenantId, userId, journalId: id, idempotencyKey, correlationId: req.headers["x-correlation-id"] as string | undefined },
        deps,
      );
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /journals/:id/reverse — reverse a posted journal (idempotent)
  app.post("/journals/:id/reverse", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const idempotencyKey = req.headers["idempotency-key"] as string;
    const { reason } = ReasonBodySchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return reverseJournal(
        { tenantId, userId, journalId: id, idempotencyKey, reason, correlationId: req.headers["x-correlation-id"] as string | undefined },
        deps,
      );
    });

    return result.ok
      ? reply.status(201).send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /journals/:id/void — void a draft journal
  app.post("/journals/:id/void", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const { reason } = ReasonBodySchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return voidJournal({ tenantId, journalId: id, userId, reason, correlationId: req.headers["x-correlation-id"] as string | undefined }, deps);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /journals — paginated list by period
  app.get("/journals", async (req, reply) => {
    const { periodId, status, page, limit } = JournalListQuerySchema.parse(req.query);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.journalRepo.findByPeriod(periodId, status, { page, limit });
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /journals/:id/audit — audit trail for a journal
  app.get("/journals/:id/audit", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.journalAuditRepo.findByJournalId(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /journals/:id — get by ID (read — userId optional)
  app.get("/journals/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.journalRepo.findById(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
