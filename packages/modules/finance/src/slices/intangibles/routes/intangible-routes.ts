import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";

export function registerIntangibleRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/intangible-assets", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.intangibleAssetRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/intangible-assets/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const asset = await deps.intangibleAssetRepo.findById(req.params.id);
      if (!asset) return reply.status(404).send({ error: "Intangible asset not found" });
      return asset;
    });
  });

  app.post("/intangible-assets", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.intangibleAssetRepo.create(tenantId, body as never);
    });
  });
}
