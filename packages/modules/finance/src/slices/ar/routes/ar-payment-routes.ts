import type { FastifyInstance } from "fastify";
import { AllocatePaymentSchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";
import { allocatePayment } from "../services/allocate-payment.js";

export function registerArPaymentRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /ar/payments — allocate payment to invoices
  app.post("/ar/payments", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const body = AllocatePaymentSchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return allocatePayment(
        {
          tenantId,
          userId,
          customerId: body.customerId,
          paymentDate: new Date(body.paymentDate),
          paymentRef: body.paymentRef,
          paymentAmount: BigInt(Math.round(body.paymentAmount * 100)), // eslint-disable-line no-restricted-syntax
          currencyCode: body.currencyCode,
        },
        deps,
      );
    });

    return result.ok
      ? reply.status(201).send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
