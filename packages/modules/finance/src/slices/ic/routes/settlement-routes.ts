import type { FastifyInstance } from 'fastify';
import { IdParamSchema, CreateIcSettlementSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { settleIcDocuments } from '../services/settle-ic-documents.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerSettlementRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ic-settlements — create and confirm settlement
  app.post(
    '/ic-settlements',
    { preHandler: [requirePermission(policy, 'ic:settle')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateIcSettlementSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return settleIcDocuments(
          {
            tenantId,
            userId,
            sellerCompanyId: body.sellerCompanyId,
            buyerCompanyId: body.buyerCompanyId,
            documentIds: body.documentIds,
            settlementMethod: body.settlementMethod,
            settlementAmount: BigInt(body.settlementAmount),
            currency: body.currency,
            fxGainLoss: BigInt(body.fxGainLoss),
            reason: body.reason,
          },
          {
            icSettlementRepo: deps.icSettlementRepo,
            icTransactionRepo: deps.icTransactionRepo,
            outboxWriter: deps.outboxWriter,
          }
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ic-settlements/:id
  app.get(
    '/ic-settlements/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.icSettlementRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
