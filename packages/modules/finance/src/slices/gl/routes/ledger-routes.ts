import type { FastifyInstance } from "fastify";
import { IdParamSchema, PaginationSchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";

export function registerLedgerRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // GET /ledgers — paginated list
  app.get("/ledgers", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const pagination = PaginationSchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.ledgerRepo.findAll(pagination);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /ledgers/:id
  app.get("/ledgers/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.ledgerRepo.findById(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
