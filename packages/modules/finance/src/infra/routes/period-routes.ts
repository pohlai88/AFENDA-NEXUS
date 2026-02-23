import type { FastifyInstance } from "fastify";
import { IdParamSchema, PaginationSchema, OptionalReasonBodySchema, CloseYearSchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../app/ports/finance-runtime.js";
import { closePeriod } from "../../app/services/close-period.js";
import { lockPeriod } from "../../app/services/lock-period.js";
import { reopenPeriod } from "../../app/services/reopen-period.js";
import { closeYear } from "../../app/services/close-year.js";
import { mapErrorToStatus } from "./error-mapper.js";

export function registerPeriodRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // GET /periods — paginated list
  app.get("/periods", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const pagination = PaginationSchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.periodRepo.findAll(pagination);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /periods/:id
  app.get("/periods/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.periodRepo.findById(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /periods/:id/close — requires x-user-id
  app.post("/periods/:id/close", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;

    const { reason } = OptionalReasonBodySchema.parse(req.body ?? {});

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return closePeriod({ tenantId, periodId: id, userId, reason, correlationId: req.headers["x-correlation-id"] as string | undefined }, deps);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /periods/:id/lock — requires x-user-id, period must be CLOSED
  app.post("/periods/:id/lock", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;

    const { reason } = OptionalReasonBodySchema.parse(req.body ?? {});

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return lockPeriod({ tenantId, periodId: id, userId, reason, correlationId: req.headers["x-correlation-id"] as string | undefined }, deps);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /periods/:id/reopen — requires x-user-id, period must be CLOSED (not LOCKED)
  app.post("/periods/:id/reopen", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;

    const { reason } = OptionalReasonBodySchema.parse(req.body ?? {});

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return reopenPeriod({ tenantId, periodId: id, userId, reason, correlationId: req.headers["x-correlation-id"] as string | undefined }, deps);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /periods/close-year — year-end close with evidence pack
  app.post("/periods/close-year", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
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
        deps,
      );
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
