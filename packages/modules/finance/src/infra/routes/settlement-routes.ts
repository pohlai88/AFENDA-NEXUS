import type { FastifyInstance } from "fastify";
import { IdParamSchema, CreateIcSettlementSchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../app/ports/finance-runtime.js";
import { settleIcDocuments } from "../../app/services/settle-ic-documents.js";
import { mapErrorToStatus } from "./error-mapper.js";

export function registerSettlementRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /ic-settlements — create and confirm settlement
  app.post("/ic-settlements", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const body = CreateIcSettlementSchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return settleIcDocuments(
        {
          tenantId,
          userId,
          sellerCompanyId: body.sellerCompanyId,
          buyerCompanyId: body.buyerCompanyId,
          documentIds: body.documentIds,
          settlementMethod: body.settlementMethod,
          settlementAmount: BigInt(body.settlementAmount),
          currency: body.currency,
          fxGainLoss: BigInt(body.fxGainLoss),
          reason: body.reason,
        },
        {
          icSettlementRepo: deps.icSettlementRepo,
          icTransactionRepo: deps.icTransactionRepo,
          outboxWriter: deps.outboxWriter,
        },
      );
    });

    return result.ok
      ? reply.status(201).send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /ic-settlements/:id
  app.get("/ic-settlements/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.icSettlementRepo.findById(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
