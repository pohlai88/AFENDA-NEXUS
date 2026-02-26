import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreateArInvoiceSchema,
  PostArInvoiceSchema,
  ArInvoiceListQuerySchema,
  CreateCreditNoteSchema,
  WriteOffInvoiceSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { postArInvoice } from '../services/post-ar-invoice.js';
import { createCreditNote } from '../services/create-credit-note.js';
import { writeOffInvoice } from '../services/write-off-invoice.js';
import { extractIdentity } from '@afenda/api-kit';
import { toMinorUnits } from '@afenda/core';

export function registerArInvoiceRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ar/invoices — create AR invoice
  app.post(
    '/ar/invoices',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateArInvoiceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const lines = body.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description ?? null,
          quantity: l.quantity,
          unitPrice: toMinorUnits(l.unitPrice, body.currencyCode),
          amount: toMinorUnits(l.amount, body.currencyCode),
          taxAmount: toMinorUnits(l.taxAmount, body.currencyCode),
        }));

        return deps.arInvoiceRepo.create({
          tenantId,
          companyId: body.companyId,
          customerId: body.customerId,
          ledgerId: body.ledgerId,
          invoiceNumber: body.invoiceNumber,
          customerRef: body.customerRef ?? null,
          invoiceDate: new Date(body.invoiceDate),
          dueDate: new Date(body.dueDate),
          currencyCode: body.currencyCode,
          description: body.description ?? null,
          paymentTermsId: body.paymentTermsId ?? null,
          lines,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ar/invoices — paginated list
  app.get(
    '/ar/invoices',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = ArInvoiceListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (query.customerId) {
          return deps.arInvoiceRepo.findByCustomer(query.customerId, query);
        }
        if (query.status) {
          return deps.arInvoiceRepo.findByStatus(query.status, query);
        }
        return deps.arInvoiceRepo.findAll(query);
      });

      return reply.send(result);
    }
  );

  // GET /ar/invoices/:id
  app.get(
    '/ar/invoices/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.arInvoiceRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ar/invoices/:id/post — post AR invoice to GL
  app.post(
    '/ar/invoices/:id/post',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = PostArInvoiceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return postArInvoice(
          {
            tenantId,
            userId,
            invoiceId: id,
            fiscalPeriodId: body.fiscalPeriodId,
            arAccountId: body.arAccountId,
          },
          deps
        );
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ar/invoices/:id/write-off
  app.post(
    '/ar/invoices/:id/write-off',
    { preHandler: [requirePermission(policy, 'journal:void')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = WriteOffInvoiceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return writeOffInvoice({ tenantId, userId, invoiceId: id, reason: body.reason }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ar/credit-notes — create credit note
  app.post(
    '/ar/credit-notes',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreateCreditNoteSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return createCreditNote(
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
