import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";

export function registerTransferPricingRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/tp-policies", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.tpPolicyRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/tp-policies/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const policy = await deps.tpPolicyRepo.findById(req.params.id);
      if (!policy) return reply.status(404).send({ error: "TP policy not found" });
      return policy;
    });
  });

  app.post("/tp-policies", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.tpPolicyRepo.create(tenantId, body as never);
    });
  });

  app.get<{ Params: { id: string } }>("/tp-policies/:id/benchmarks", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.tpBenchmarkRepo.findByPolicy(req.params.id);
    });
  });

  app.post<{ Params: { id: string } }>("/tp-policies/:id/benchmarks", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.tpBenchmarkRepo.create(tenantId, {
        policyId: req.params.id,
        ...body,
      } as never);
    });
  });
}
