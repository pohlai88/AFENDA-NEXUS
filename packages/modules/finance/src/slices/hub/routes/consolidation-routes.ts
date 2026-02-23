/**
 * GAP-11: Consolidation route — exposes the consolidation orchestration service.
 */
import type { FastifyInstance } from "fastify";
import { ConsolidationQuerySchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { consolidate } from "../services/consolidate.js";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";

export function registerConsolidationRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /consolidation — run multi-entity consolidation
  app.post("/consolidation", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const body = ConsolidationQuerySchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return consolidate(
        {
          tenantId,
          groupLedgerId: body.groupLedgerId,
          subsidiaryLedgerIds: body.subsidiaryLedgerIds,
          fiscalYear: body.fiscalYear,
          fiscalPeriod: body.fiscalPeriod,
          asOfDate: new Date(body.asOfDate),
          icBalances: [], // IC balances loaded internally or passed separately
        },
        {
          balanceRepo: deps.balanceRepo,
          fxRateRepo: deps.fxRateRepo,
          ledgerRepo: deps.ledgerRepo,
        },
      );
    });

    if (!result.ok) {
      return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
    return reply.send(result.value);
  });
}
