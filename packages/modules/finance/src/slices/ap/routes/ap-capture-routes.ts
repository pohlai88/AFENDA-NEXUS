import type { FastifyInstance } from 'fastify';
import { IdParamSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { createCreditMemo } from '../services/create-credit-memo.js';
import { batchInvoiceImport } from '../services/batch-invoice-import.js';
import { processBankRejection } from '../services/process-bank-rejection.js';
import { generateRemittanceAdvice } from '../services/generate-remittance-advice.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerApCaptureRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // W4-1: POST /ap/credit-memos — create credit memo
  app.post(
    '/ap/credit-memos',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as {
        originalInvoiceId: string;
        reason: string;
        correlationId?: string;
      };

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return createCreditMemo(
          {
            tenantId,
            userId,
            originalInvoiceId: body.originalInvoiceId,
            reason: body.reason,
            correlationId: body.correlationId,
          },
          deps
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // W4-3: POST /ap/invoices/import — batch invoice import
  app.post(
    '/ap/invoices/import',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as {
        rows: import('../services/batch-invoice-import.js').BatchInvoiceRow[];
        correlationId?: string;
      };

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return batchInvoiceImport(
          { tenantId, userId, rows: body.rows, correlationId: body.correlationId },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // W4-5: POST /ap/payment-runs/:id/bank-rejection — process bank rejection
  app.post(
    '/ap/payment-runs/:id/bank-rejection',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as {
        rejectionCode: string;
        rejectionReason: string;
        rejectedItemIds?: string[];
        correlationId?: string;
      };

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return processBankRejection({ tenantId, userId, paymentRunId: id, ...body }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // W4-6: GET /ap/payment-runs/:id/remittance-advice — generate remittance advice
  app.get(
    '/ap/payment-runs/:id/remittance-advice',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return generateRemittanceAdvice({ tenantId, userId, paymentRunId: id }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
