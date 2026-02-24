import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import type { DriverType } from "../entities/cost-driver.js";
import { runCostAllocation } from "../services/run-allocation.js";

export function registerCostAccountingRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  // ─── Cost Centers ─────────────────────────────────────────────────────────

  app.get("/cost-centers", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.costCenterRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/cost-centers/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const cc = await deps.costCenterRepo.findById(req.params.id);
      if (!cc) return reply.status(404).send({ error: "Cost center not found" });
      return cc;
    });
  });

  app.post("/cost-centers", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.costCenterRepo.create(tenantId, {
        companyId: body.companyId as string,
        code: body.code as string,
        name: body.name as string,
        parentId: (body.parentId as string) ?? null,
        level: (body.level as number) ?? 0,
        currencyCode: (body.currencyCode as string) ?? "USD",
        managerId: (body.managerId as string) ?? null,
        effectiveFrom: new Date(body.effectiveFrom as string),
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo as string) : null,
      });
    });
  });

  // ─── Cost Drivers ─────────────────────────────────────────────────────────

  app.get("/cost-drivers", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.costDriverRepo.findAll();
      return { data: list };
    });
  });

  app.post("/cost-drivers", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.costDriverRepo.create(tenantId, {
        companyId: body.companyId as string,
        code: body.code as string,
        name: body.name as string,
        driverType: body.driverType as DriverType,
        unitOfMeasure: body.unitOfMeasure as string,
      });
    });
  });

  // ─── Allocation Runs ──────────────────────────────────────────────────────

  app.get("/cost-allocation-runs", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.costAllocationRunRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/cost-allocation-runs/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const run = await deps.costAllocationRunRepo.findById(req.params.id);
      if (!run) return reply.status(404).send({ error: "Allocation run not found" });
      const lines = await deps.costAllocationRunRepo.findLinesByRun(run.id);
      return { ...run, lines };
    });
  });

  app.post("/cost-allocation-runs", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const result = await runCostAllocation(
        {
          tenantId,
          userId,
          companyId: body.companyId as string,
          periodId: body.periodId as string,
          method: body.method as "DIRECT" | "STEP_DOWN" | "RECIPROCAL",
          driverId: body.driverId as string,
          currencyCode: (body.currencyCode as string) ?? "USD",
        },
        deps,
      );
      if (!result.ok) return reply.status(400).send({ error: result.error });
      return result.value;
    });
  });
}
