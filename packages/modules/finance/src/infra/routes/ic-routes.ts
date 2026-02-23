import type { FastifyInstance } from "fastify";
import { CreateIcTransactionSchema, IdParamSchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../app/ports/finance-runtime.js";
import { createIcTransaction } from "../../app/services/create-ic-transaction.js";
import { mapErrorToStatus } from "./error-mapper.js";

export function registerIcRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /ic-transactions — create paired IC journals
  app.post("/ic-transactions", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const body = CreateIcTransactionSchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return createIcTransaction(
        {
          tenantId,
          userId,
          agreementId: body.agreementId,
          sourceLedgerId: body.sourceLedgerId,
          mirrorLedgerId: body.mirrorLedgerId,
          fiscalPeriodId: body.fiscalPeriodId,
          description: body.description,
          postingDate: new Date(body.postingDate),
          currency: body.currency,
          sourceLines: body.sourceLines.map((l) => ({
            accountId: l.accountId,
            debit: BigInt(l.debit),
            credit: BigInt(l.credit),
          })),
          mirrorLines: body.mirrorLines.map((l) => ({
            accountId: l.accountId,
            debit: BigInt(l.debit),
            credit: BigInt(l.credit),
          })),
        },
        deps,
      );
    });

    return result.ok
      ? reply.status(201).send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /ic-transactions/:id — read IC document by ID
  app.get("/ic-transactions/:id", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { id } = IdParamSchema.parse(req.params);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.icTransactionRepo.findById(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
