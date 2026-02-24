import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";

export function registerDeferredTaxRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/deferred-tax-items", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.deferredTaxItemRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/deferred-tax-items/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const item = await deps.deferredTaxItemRepo.findById(req.params.id);
      if (!item) return reply.status(404).send({ error: "Deferred tax item not found" });
      return item;
    });
  });

  app.post("/deferred-tax-items", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.deferredTaxItemRepo.create(tenantId, body as never);
    });
  });
}
