import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";

export function registerProjectRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/projects", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.projectRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/projects/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const project = await deps.projectRepo.findById(req.params.id);
      if (!project) return reply.status(404).send({ error: "Project not found" });
      return project;
    });
  });

  app.get<{ Params: { id: string } }>("/projects/:id/costs", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const lines = await deps.projectRepo.findCostLines(req.params.id);
      return { data: lines };
    });
  });

  app.get<{ Params: { id: string } }>("/projects/:id/billings", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const billings = await deps.projectRepo.findBillings(req.params.id);
      return { data: billings };
    });
  });
}
