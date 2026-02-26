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
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { postApInvoice } from '../services/post-ap-invoice.js';
import { createDebitMemo } from '../services/create-debit-memo.js';

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
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
      const body = CreateApInvoiceSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const lines = body.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description ?? null,
          quantity: l.quantity,
          unitPrice: BigInt(Math.round(l.unitPrice * 100)), // eslint-disable-line no-restricted-syntax
          amount: BigInt(Math.round(l.amount * 100)), // eslint-disable-line no-restricted-syntax
          taxAmount: BigInt(Math.round(l.taxAmount * 100)), // eslint-disable-line no-restricted-syntax
        }));

        return deps.apInvoiceRepo.create({
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
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
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
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';

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
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
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

  // POST /ap/debit-memos — create debit memo
  app.post(
    '/ap/debit-memos',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req.headers['x-user-id'] as string) ?? 'system';
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
