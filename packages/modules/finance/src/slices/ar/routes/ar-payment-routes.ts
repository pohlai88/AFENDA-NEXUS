import type { FastifyInstance } from 'fastify';
import { AllocatePaymentSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { allocatePayment } from '../services/allocate-payment.js';
import { extractIdentity } from '@afenda/api-kit';
import { toMinorUnits } from '@afenda/core';

export function registerArPaymentRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ar/payments — allocate payment to invoices
  app.post(
    '/ar/payments',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = AllocatePaymentSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return allocatePayment(
          {
            tenantId,
            userId,
            customerId: body.customerId,
            paymentDate: new Date(body.paymentDate),
            paymentRef: body.paymentRef,
            paymentAmount: toMinorUnits(body.paymentAmount, body.currencyCode),
            currencyCode: body.currencyCode,
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
