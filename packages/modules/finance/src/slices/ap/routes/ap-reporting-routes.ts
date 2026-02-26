import type { FastifyInstance } from 'fastify';
import { IdParamSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { getPaymentRunReport } from '../services/get-payment-run-report.js';
import { computeApPeriodCloseChecklist } from '../services/ap-period-close-checklist.js';
import { getInvoiceAuditTimeline } from '../services/get-invoice-audit-timeline.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerApReportingRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // W3-3: GET /ap/payment-runs/:id/report — per-supplier breakdown
  app.get(
    '/ap/payment-runs/:id/report',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getPaymentRunReport({ tenantId, paymentRunId: id }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // W3-2: GET /ap/period-close-checklist — AP close readiness
  app.get(
    '/ap/period-close-checklist',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return computeApPeriodCloseChecklist({ tenantId, userId }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // W3-6: GET /ap/invoices/:id/timeline — invoice audit timeline
  app.get(
    '/ap/invoices/:id/timeline',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getInvoiceAuditTimeline({ tenantId, invoiceId: id }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
