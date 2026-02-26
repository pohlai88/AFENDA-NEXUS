import type { FastifyInstance } from 'fastify';
import {
  IdParamSchema,
  CreatePaymentRunSchema,
  AddPaymentRunItemSchema,
  PaymentRunListQuerySchema,
  ReversePaymentRunSchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission, requireSoD } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { executePaymentRun } from '../services/execute-payment-run.js';
import { reversePaymentRun } from '../services/reverse-payment-run.js';
import { extractIdentity } from '@afenda/api-kit';
import { toMinorUnits } from '@afenda/core';
import { computeEarlyPaymentDiscount } from '../calculators/early-payment-discount.js';

export function registerApPaymentRunRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ap/payment-runs — create payment run
  app.post(
    '/ap/payment-runs',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = CreatePaymentRunSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.apPaymentRunRepo.create({
          tenantId,
          companyId: body.companyId,
          runDate: new Date(body.runDate),
          cutoffDate: new Date(body.cutoffDate),
          currencyCode: body.currencyCode,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // GET /ap/payment-runs — paginated list
  app.get(
    '/ap/payment-runs',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const query = PaymentRunListQuerySchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.apPaymentRunRepo.findAll(query);
      });

      return reply.send(result);
    }
  );

  // GET /ap/payment-runs/:id
  app.get(
    '/ap/payment-runs/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.apPaymentRunRepo.findById(id);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/payment-runs/:id/items — add item to payment run
  app.post(
    '/ap/payment-runs/:id/items',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = AddPaymentRunItemSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        const runResult = await deps.apPaymentRunRepo.findById(id);
        if (!runResult.ok) return runResult;
        const run = runResult.value;
        const cc = run.totalAmount.currency;
        const amount = toMinorUnits(body.amount, cc);
        let discountAmount = toMinorUnits(body.discountAmount, cc);
        let netAmount = toMinorUnits(body.netAmount, cc);

        // W2-4: Auto-compute early payment discount if not explicitly provided
        if (discountAmount === 0n) {
          const invoiceResult = await deps.apInvoiceRepo.findById(body.invoiceId);
          if (invoiceResult.ok && invoiceResult.value.paymentTermsId) {
            const termsResult = await deps.paymentTermsRepo.findById(
              invoiceResult.value.paymentTermsId
            );
            if (termsResult.ok) {
              const discount = computeEarlyPaymentDiscount(
                amount,
                invoiceResult.value.invoiceDate,
                run.runDate,
                termsResult.value
              );
              if (discount.eligible) {
                discountAmount = discount.discountAmount;
                netAmount = discount.netPayable;
              }
            }
          }
        }

        return deps.apPaymentRunRepo.addItem(id, {
          invoiceId: body.invoiceId,
          supplierId: body.supplierId,
          amount,
          discountAmount,
          netAmount,
        });
      });

      return result.ok
        ? reply.status(201).send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/payment-runs/:id/execute — execute payment run
  app.post(
    '/ap/payment-runs/:id/execute',
    {
      preHandler: [
        requirePermission(policy, 'journal:post'),
        requireSoD(policy, 'journal:post', 'payment_run'),
      ],
    },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return executePaymentRun({ tenantId, userId, paymentRunId: id }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );

  // POST /ap/payment-runs/:id/reverse — reverse an executed payment run
  app.post(
    '/ap/payment-runs/:id/reverse',
    {
      preHandler: [
        requirePermission(policy, 'journal:post'),
        requireSoD(policy, 'journal:post', 'payment_run'),
      ],
    },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);
      const body = ReversePaymentRunSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return reversePaymentRun({ tenantId, userId, paymentRunId: id, reason: body.reason }, deps);
      });

      return result.ok
        ? reply.send(result.value)
        : reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
  );
}
