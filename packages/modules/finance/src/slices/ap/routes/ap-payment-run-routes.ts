import type { FastifyInstance } from "fastify";
import {
  IdParamSchema,
  CreatePaymentRunSchema,
  AddPaymentRunItemSchema,
  PaymentRunListQuerySchema,
} from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";
import { executePaymentRun } from "../services/execute-payment-run.js";

export function registerApPaymentRunRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /ap/payment-runs — create payment run
  app.post("/ap/payment-runs", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const body = CreatePaymentRunSchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.apPaymentRunRepo.create({
        tenantId,
        companyId: body.companyId,
        runDate: new Date(body.runDate),
        cutoffDate: new Date(body.cutoffDate),
        currencyCode: body.currencyCode,
      });
    });

    return result.ok
      ? reply.status(201).send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // GET /ap/payment-runs — paginated list
  app.get("/ap/payment-runs", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const query = PaymentRunListQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.apPaymentRunRepo.findAll(query);
    });

    return reply.send(result);
  });

  // GET /ap/payment-runs/:id
  app.get("/ap/payment-runs/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.apPaymentRunRepo.findById(id);
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /ap/payment-runs/:id/items — add item to payment run
  app.post("/ap/payment-runs/:id/items", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const body = AddPaymentRunItemSchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.apPaymentRunRepo.addItem(id, {
        invoiceId: body.invoiceId,
        supplierId: body.supplierId,
        amount: BigInt(Math.round(body.amount * 100)), // eslint-disable-line no-restricted-syntax
        discountAmount: BigInt(Math.round(body.discountAmount * 100)), // eslint-disable-line no-restricted-syntax
        netAmount: BigInt(Math.round(body.netAmount * 100)), // eslint-disable-line no-restricted-syntax
      });
    });

    return result.ok
      ? reply.status(201).send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });

  // POST /ap/payment-runs/:id/execute — execute payment run
  app.post("/ap/payment-runs/:id/execute", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return executePaymentRun(
        { tenantId, userId, paymentRunId: id },
        deps,
      );
    });

    return result.ok
      ? reply.send(result.value)
      : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
  });
}
