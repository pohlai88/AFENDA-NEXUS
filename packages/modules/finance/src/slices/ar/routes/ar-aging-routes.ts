import type { FastifyInstance } from "fastify";
import { ArAgingQuerySchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";
import { getArAging } from "../services/get-ar-aging.js";

export function registerArAgingRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // GET /ar/aging — AR aging report
  app.get("/ar/aging", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const query = ArAgingQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getArAging(
        {
          tenantId,
          asOfDate: query.asOfDate ? new Date(query.asOfDate) : undefined,
        },
        deps,
      );
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
