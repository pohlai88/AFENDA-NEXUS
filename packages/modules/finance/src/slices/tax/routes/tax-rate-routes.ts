import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";

export function registerTaxRateRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/tax/rates", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const rates = await deps.taxRateRepo.findAll();
      return { data: rates };
    });
  });

  app.post("/tax/rates", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const rate = await deps.taxRateRepo.create(tenantId, body as unknown as Parameters<typeof deps.taxRateRepo.create>[1]);
      return reply.status(201).send(rate);
    });
  });
}
