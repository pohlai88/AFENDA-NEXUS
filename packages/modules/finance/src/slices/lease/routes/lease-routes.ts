import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";

export function registerLeaseRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/leases", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.leaseContractRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/leases/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const lease = await deps.leaseContractRepo.findById(req.params.id);
      if (!lease) return reply.status(404).send({ error: "Lease not found" });
      return lease;
    });
  });

  app.post("/leases", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.leaseContractRepo.create(tenantId, body as never);
    });
  });

  app.get<{ Params: { id: string } }>("/leases/:id/schedule", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.leaseScheduleRepo.findByLease(req.params.id);
    });
  });

  app.get<{ Params: { id: string } }>("/leases/:id/modifications", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.leaseModificationRepo.findByLease(req.params.id);
    });
  });
}
