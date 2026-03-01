import type { FastifyInstance } from 'fastify';
import { IdParamSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { getPaymentRunReport } from '../services/get-payment-run-report.js';
import { computeApPeriodCloseChecklist } from '../services/ap-period-close-checklist.js';
import { getInvoiceAuditTimeline } from '../services/get-invoice-audit-timeline.js';
import { getInvoiceEarlyDiscount } from '../services/get-invoice-early-discount.js';
import { getApDiscountSummary } from '../services/get-ap-discount-summary.js';
import { getPaymentProposal } from '../services/get-payment-proposal.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerApReportingRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // GET /ap/payment-proposal — suggest invoices for new payment run
  app.get(
    '/ap/payment-proposal',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const q = req.query as {
        companyId?: string;
        runDate?: string;
        cutoffDate?: string;
        currencyCode?: string;
        includeDiscountOpportunities?: string;
      };
      const companyId = q.companyId ?? '';
      const runDate = q.runDate ? new Date(q.runDate) : new Date();
      const cutoffDate = q.cutoffDate ? new Date(q.cutoffDate) : new Date();
      const currencyCode = q.currencyCode ?? 'USD';
      const includeDiscountOpportunities = q.includeDiscountOpportunities === 'true';

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getPaymentProposal(
          {
            tenantId,
            companyId,
            runDate,
            cutoffDate,
            currencyCode,
            includeDiscountOpportunities,
          },
          deps
        );
      });

      if (!result.ok) {
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      }
      const proposal = result.value;
      return reply.send({
        paymentDate: proposal.paymentDate.toISOString(),
        cutoffDate: proposal.cutoffDate.toISOString(),
        groups: proposal.groups.map((g) => ({
          ...g,
          totalGross: String(g.totalGross),
          totalDiscount: String(g.totalDiscount),
          totalNet: String(g.totalNet),
          items: g.items.map((i) => ({
            ...i,
            outstandingAmount: String(i.outstandingAmount),
            discountAmount: String(i.discountAmount),
            netPayable: String(i.netPayable),
            dueDate: i.dueDate.toISOString(),
          })),
        })),
        summary: {
          ...proposal.summary,
          totalGross: String(proposal.summary.totalGross),
          totalDiscount: String(proposal.summary.totalDiscount),
          totalNet: String(proposal.summary.totalNet),
          discountSavings: String(proposal.summary.discountSavings),
        },
      });
    }
  );

  // GET /ap/discount-summary — discount captured for KPI (last 30 days)
  app.get(
    '/ap/discount-summary',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const days = Number((req.query as { days?: string }).days) || 30;

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getApDiscountSummary({ tenantId, days }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

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

  // Early discount: GET /ap/invoices/:id/early-discount — "Pay by X to save Y%" badge
  app.get(
    '/ap/invoices/:id/early-discount',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const paymentDate = new Date();

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getInvoiceEarlyDiscount(
          { tenantId, invoiceId: id, paymentDate },
          deps
        );
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
