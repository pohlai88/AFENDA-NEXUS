import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { disposeAsset } from "../services/dispose-asset.js";
import { runDepreciation } from "../services/run-depreciation.js";

export function registerAssetRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/fixed-assets", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const list = await deps.assetRepo.findAll();
      return { data: list };
    });
  });

  app.get<{ Params: { id: string } }>("/fixed-assets/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const asset = await deps.assetRepo.findById(req.params.id);
      if (!asset) return reply.status(404).send({ error: "Asset not found" });
      return asset;
    });
  });

  app.post("/fixed-assets", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const asset = await deps.assetRepo.create(tenantId, body as unknown as Parameters<typeof deps.assetRepo.create>[1]);
      return reply.status(201).send(asset);
    });
  });

  app.post<{ Params: { id: string } }>("/fixed-assets/:id/dispose", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const result = await disposeAsset(
        {
          tenantId,
          userId,
          assetId: req.params.id,
          disposalProceeds: BigInt((body.disposalProceeds as number) ?? 0),
          disposalCosts: BigInt((body.disposalCosts as number) ?? 0),
          disposalDate: new Date((body.disposalDate as string) ?? new Date().toISOString()),
        },
        deps,
      );
      if (!result.ok) return reply.status(400).send({ error: result.error });
      return result.value;
    });
  });

  app.post("/fixed-assets/depreciation-run", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const result = await runDepreciation(
        {
          tenantId,
          userId,
          periodStart: new Date(body.periodStart as string),
          periodEnd: new Date(body.periodEnd as string),
        },
        deps,
      );
      if (!result.ok) return reply.status(400).send({ error: result.error });
      return reply.status(201).send(result.value);
    });
  });
}
