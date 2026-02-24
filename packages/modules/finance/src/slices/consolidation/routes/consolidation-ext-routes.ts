import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { updateOwnership } from "../services/update-ownership.js";

export function registerConsolidationExtRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  // ─── Group Entities ─────────────────────────────────────────────────────

  app.get("/group-entities", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.groupEntityRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/group-entities/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const entity = await deps.groupEntityRepo.findById(req.params.id);
      if (!entity) return reply.status(404).send({ error: "Group entity not found" });
      return entity;
    });
  });

  app.post("/group-entities", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.groupEntityRepo.create(tenantId, {
        companyId: body.companyId as string,
        name: body.name as string,
        entityType: body.entityType as "PARENT" | "SUBSIDIARY" | "ASSOCIATE" | "JOINT_VENTURE",
        parentEntityId: (body.parentEntityId as string) ?? null,
        baseCurrency: body.baseCurrency as string,
        countryCode: body.countryCode as string,
      });
    });
  });

  // ─── Ownership Records ──────────────────────────────────────────────────

  app.get("/ownership-records", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.ownershipRecordRepo.findAll();
      return { data: list };
    });
  });

  app.post("/ownership-records", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const result = await updateOwnership(
        {
          tenantId,
          userId,
          parentEntityId: body.parentEntityId as string,
          childEntityId: body.childEntityId as string,
          newOwnershipPctBps: body.ownershipPctBps as number,
          newVotingPctBps: body.votingPctBps as number,
          effectiveDate: new Date(body.effectiveDate as string),
          acquisitionCost: BigInt(body.acquisitionCost as string),
          currencyCode: body.currencyCode as string,
        },
        deps,
      );
      if (!result.ok) return reply.status(400).send({ error: result.error });
      return result.value;
    });
  });

  // ─── Goodwill ───────────────────────────────────────────────────────────

  app.get("/goodwills", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.goodwillRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/goodwills/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const gw = await deps.goodwillRepo.findById(req.params.id);
      if (!gw) return reply.status(404).send({ error: "Goodwill not found" });
      return gw;
    });
  });
}
