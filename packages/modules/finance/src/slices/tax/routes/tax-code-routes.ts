import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";

export function registerTaxCodeRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/tax/codes", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const codes = await deps.taxCodeRepo.findAll();
      return { data: codes };
    });
  });

  app.get<{ Params: { id: string } }>("/tax/codes/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const code = await deps.taxCodeRepo.findById(req.params.id);
      if (!code) return reply.status(404).send({ error: "Tax code not found" });
      return code;
    });
  });

  app.post("/tax/codes", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const code = await deps.taxCodeRepo.create(tenantId, body as unknown as Parameters<typeof deps.taxCodeRepo.create>[1]);
      return reply.status(201).send(code);
    });
  });
}
