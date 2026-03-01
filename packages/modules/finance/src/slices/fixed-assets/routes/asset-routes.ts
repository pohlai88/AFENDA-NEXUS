import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import type { CreateAssetInput } from '../ports/asset-repo.js';
import { disposeAsset } from '../services/dispose-asset.js';
import { runDepreciation } from '../services/run-depreciation.js';
import { previewDepreciationRun } from '../services/preview-depreciation-run.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerAssetRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/fixed-assets',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.assetRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/fixed-assets/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const asset = await deps.assetRepo.findById(req.params.id);
        if (!asset) return reply.status(404).send({ error: 'Asset not found' });
        return asset;
      });
    }
  );

  app.post(
    '/fixed-assets',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const asset = await deps.assetRepo.create(tenantId, body as unknown as CreateAssetInput);
        return reply.status(201).send(asset);
      });
    }
  );

  app.post<{ Params: IdParam }>(
    '/fixed-assets/:id/dispose',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
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
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return result.value;
      });
    }
  );

  app.post(
    '/fixed-assets/depreciation-run',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await runDepreciation(
          {
            tenantId,
            userId,
            periodStart: new Date(body.periodStart as string),
            periodEnd: new Date(body.periodEnd as string),
          },
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return reply.status(201).send(result.value);
      });
    }
  );

  // POST /fixed-assets/depreciation-run/preview — preview GL lines without persisting
  app.post(
    '/fixed-assets/depreciation-run/preview',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as Record<string, unknown>;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await previewDepreciationRun(
          {
            periodStart: new Date(body.periodStart as string),
            periodEnd: new Date(body.periodEnd as string),
          },
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return result.value;
      });
    }
  );
}
