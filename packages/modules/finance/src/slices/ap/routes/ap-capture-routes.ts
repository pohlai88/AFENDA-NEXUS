import type { FastifyInstance } from 'fastify';
import { IdParamSchema, OcrUploadContextSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { createCreditMemo } from '../services/create-credit-memo.js';
import { batchInvoiceImport } from '../services/batch-invoice-import.js';
import { processBankRejection } from '../services/process-bank-rejection.js';
import { generateRemittanceAdvice } from '../services/generate-remittance-advice.js';
import { uploadOcrInvoice } from '../services/ap-ocr-pipeline.js';
import type { OcrPipelineDeps } from '../services/ap-ocr-pipeline.js';
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

  // B3: POST /ap/ocr/upload — multipart file upload OCR pipeline
  // Validation order (spec invariant 2): auth → mime check → buffer → claimOrGet
  app.post(
    '/ap/ocr/upload',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = req.body as {
        file: { data: Buffer; mimetype: string };
        companyId: string;
        ledgerId: string;
        defaultAccountId: string;
        forceRetry?: boolean;
      };

      // Step 0: Validate mime from multipart metadata BEFORE reading buffer
      const file = body.file;
      if (!file) {
        return reply.status(400).send({ error: 'Missing file in multipart body' });
      }
      const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!allowedMimes.includes(file.mimetype)) {
        return reply.status(400).send({
          error: `Unsupported mime type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`,
        });
      }

      const ctx = OcrUploadContextSchema.parse({
        companyId: body.companyId,
        ledgerId: body.ledgerId,
        defaultAccountId: body.defaultAccountId,
        forceRetry: body.forceRetry,
      });

      const ocrDeps = (runtime as unknown as { ocrDeps?: OcrPipelineDeps }).ocrDeps;
      if (!ocrDeps) {
        return reply.status(501).send({ error: 'OCR pipeline not configured' });
      }

      try {
        const result = await uploadOcrInvoice(file.data, file.mimetype, {
          tenantId,
          userId,
          companyId: ctx.companyId,
          ledgerId: ctx.ledgerId,
          defaultAccountId: ctx.defaultAccountId,
          forceRetry: ctx.forceRetry,
        }, ocrDeps);

        // Spec: 201 new completed, 200 idempotent completed, 202 in-progress, 409 failed
        let httpStatus: number;
        if (result.status === 'COMPLETED') {
          httpStatus = result.invoiceId ? 201 : 200;
        } else if (result.status === 'FAILED') {
          httpStatus = 409;
        } else {
          httpStatus = 202;
        }
        return reply.status(httpStatus).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'OCR pipeline error';
        return reply.status(502).send({ error: message });
      }
    }
  );
}
