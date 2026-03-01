import type { FastifyInstance } from 'fastify';
import { IdParamSchema } from '@afenda/contracts';
import { z } from 'zod';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import {
  markInvoiceIncomplete,
  resolveTriageInvoice,
} from '../services/ap-triage-queue.js';
import { extractIdentity } from '@afenda/api-kit';

const MarkIncompleteBodySchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

const ResolveTriageBodySchema = z.object({
  targetStatus: z.enum(['DRAFT', 'PENDING_APPROVAL']),
});

export function registerApTriageRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ap/invoices/:id/mark-incomplete — move invoice to triage queue
  app.post(
    '/ap/invoices/:id/mark-incomplete',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = MarkIncompleteBodySchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return markInvoiceIncomplete(
          { tenantId, userId, invoiceId: id, reason: body.reason },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/invoices/:id/resolve-triage — move invoice back to DRAFT or PENDING_APPROVAL
  app.post(
    '/ap/invoices/:id/resolve-triage',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = ResolveTriageBodySchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return resolveTriageInvoice(
          { tenantId, userId, invoiceId: id, targetStatus: body.targetStatus },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
