import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreateApInvoiceSchema,
  PostApInvoiceSchema,
  ApInvoiceListQuerySchema,
  CreateDebitMemoSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission, requireSoD } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { postApInvoice } from '../services/post-ap-invoice.js';
import { previewApPosting } from '../services/preview-ap-posting.js';
import { approveApInvoice } from '../services/approve-ap-invoice.js';
import { cancelApInvoice } from '../services/cancel-ap-invoice.js';
import { createDebitMemo } from '../services/create-debit-memo.js';
import { detectDuplicates } from '../calculators/duplicate-detection.js';
import type { InvoiceFingerprint } from '../calculators/duplicate-detection.js';
import { extractIdentity } from '@afenda/api-kit';
import { toMinorUnits } from '@afenda/core';

export function registerApInvoiceRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ap/invoices — create AP invoice
  app.post(
    '/ap/invoices',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateApInvoiceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const lines = body.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description ?? null,
          quantity: l.quantity,
          unitPrice: toMinorUnits(l.unitPrice, body.currencyCode),
          amount: toMinorUnits(l.amount, body.currencyCode),
          taxAmount: toMinorUnits(l.taxAmount, body.currencyCode),
        }));

        const created = await deps.apInvoiceRepo.create({
          tenantId,
          companyId: body.companyId,
          supplierId: body.supplierId,
          ledgerId: body.ledgerId,
          invoiceNumber: body.invoiceNumber,
          supplierRef: body.supplierRef ?? null,
          invoiceDate: new Date(body.invoiceDate),
          dueDate: new Date(body.dueDate),
          currencyCode: body.currencyCode,
          description: body.description ?? null,
          poRef: body.poRef ?? null,
          receiptRef: body.receiptRef ?? null,
          paymentTermsId: body.paymentTermsId ?? null,
          lines,
        });
        if (!created.ok) return created;

        // W2-1: Post-create duplicate detection — auto-hold if duplicates found
        const inv = created.value;
        if (inv.supplierRef) {
          const existing = await deps.apInvoiceRepo.findBySupplier(inv.supplierId, {
            page: 1,
            limit: 500,
          });
          const fingerprints: InvoiceFingerprint[] = existing.data
            .filter((e) => e.supplierRef !== null)
            .map((e) => ({
              invoiceId: e.id,
              supplierId: e.supplierId,
              supplierRef: e.supplierRef!,
              totalAmount: e.totalAmount.amount,
              invoiceDate: e.invoiceDate,
            }));
          const dupes = detectDuplicates(fingerprints);
          const match = dupes.find((g) => g.invoices.some((i) => i.invoiceId === inv.id));
          if (match && match.invoices.length > 1) {
            const dupeIds = match.invoices
              .filter((i) => i.invoiceId !== inv.id)
              .map((i) => i.invoiceId);
            await deps.apHoldRepo.create({
              tenantId,
              invoiceId: inv.id,
              holdType: 'DUPLICATE',
              holdReason: `Potential duplicate of invoice(s): ${dupeIds.join(', ')}`,
              createdBy: userId,
            });
          }
        }

        return created;
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/invoices — paginated list
  app.get(
    '/ap/invoices',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = ApInvoiceListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (query.supplierId) {
          return deps.apInvoiceRepo.findBySupplier(query.supplierId, query);
        }
        if (query.status) {
          return deps.apInvoiceRepo.findByStatus(query.status, query);
        }
        return deps.apInvoiceRepo.findAll(query);
      });

      return reply.send(result);
    }
  );

  // GET /ap/invoices/:id
  app.get(
    '/ap/invoices/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.apInvoiceRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/invoices/:id/post — post AP invoice to GL
  app.post(
    '/ap/invoices/:id/post',
    {
      preHandler: [
        requirePermission(policy, 'journal:post'),
        requireSoD(policy, 'journal:post', 'ap_invoice'),
      ],
    },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = PostApInvoiceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return postApInvoice(
          {
            tenantId,
            userId,
            invoiceId: id,
            fiscalPeriodId: body.fiscalPeriodId,
            apAccountId: body.apAccountId,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/invoices/:id/approve — approve AP invoice
  app.post(
    '/ap/invoices/:id/approve',
    { preHandler: [requirePermission(policy, 'journal:approve')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return approveApInvoice({ tenantId, userId, invoiceId: id }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/invoices/:id/cancel — cancel AP invoice
  app.post(
    '/ap/invoices/:id/cancel',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = (req.body as { reason?: string }) ?? {};

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return cancelApInvoice(
          { tenantId, userId, invoiceId: id, reason: body.reason ?? 'Cancelled' },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/invoices/:id/preview-posting — preview GL lines without persisting
  app.post(
    '/ap/invoices/:id/preview-posting',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = PostApInvoiceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return previewApPosting(
          {
            invoiceId: id,
            fiscalPeriodId: body.fiscalPeriodId,
            apAccountId: body.apAccountId,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/debit-memos — create debit memo
  app.post(
    '/ap/debit-memos',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateDebitMemoSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return createDebitMemo(
          {
            tenantId,
            userId,
            originalInvoiceId: body.originalInvoiceId,
            reason: body.reason,
          },
          deps
        );
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
