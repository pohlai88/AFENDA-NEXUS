import type { FastifyInstance } from "fastify";
import { ApAgingQuerySchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";
import { getApAging } from "../services/get-ap-aging.js";

export function registerApAgingRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // GET /ap/aging — AP aging report
  app.get("/ap/aging", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const query = ApAgingQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getApAging(
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
